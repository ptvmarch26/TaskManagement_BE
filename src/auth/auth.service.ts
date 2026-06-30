import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { randomUUID } from 'crypto';
import { StringValue } from 'ms';
import { PrismaService } from '../../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

type AccessTokenPayload = {
  sub: string;
  email: string;
};

type RefreshTokenPayload = {
  sub: string;
  tokenId: string;
};

type TokenUser = {
  id: string;
  email: string;
  fullName: string;
};

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async register(dto: RegisterDto) {
    const email = dto.email.toLowerCase().trim();

    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new ConflictException('Email already exists');
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);

    const user = await this.prisma.user.create({
      data: {
        email,
        fullName: dto.fullName.trim(),
        passwordHash,
      },
      select: {
        id: true,
        email: true,
        fullName: true,
        createdAt: true,
      },
    });

    return {
      message: 'Registered successfully',
      user,
    };
  }

  async login(dto: LoginDto, userAgent?: string, ipAddress?: string) {
    const email = dto.email.toLowerCase().trim();

    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const isPasswordValid = await bcrypt.compare(
      dto.password,
      user.passwordHash,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const tokenUser: TokenUser = {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
    };

    const accessToken = await this.generateAccessToken(tokenUser);
    const refreshToken = await this.createRefreshToken(
      user.id,
      userAgent,
      ipAddress,
    );

    return {
      message: 'Logged in successfully',
      accessToken,
      refreshToken,
      user: tokenUser,
    };
  }

  async refresh(refreshToken: string, userAgent?: string, ipAddress?: string) {
    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token is missing');
    }

    let payload: RefreshTokenPayload;

    try {
      payload = await this.jwtService.verifyAsync<RefreshTokenPayload>(
        refreshToken,
        {
          secret: this.configService.getOrThrow<string>('JWT_REFRESH_SECRET'),
        },
      );
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    const storedToken = await this.prisma.refreshToken.findUnique({
      where: {
        id: payload.tokenId,
      },
      include: {
        user: true,
      },
    });

    if (!storedToken) {
      throw new UnauthorizedException('Refresh token not found');
    }

    if (storedToken.revokedAt) {
      throw new UnauthorizedException('Refresh token has been revoked');
    }

    if (storedToken.expiresAt < new Date()) {
      throw new UnauthorizedException('Refresh token has expired');
    }

    if (!storedToken.user || !storedToken.user.isActive) {
      throw new UnauthorizedException('User is not allowed');
    }

    const isTokenValid = await bcrypt.compare(
      refreshToken,
      storedToken.tokenHash,
    );

    if (!isTokenValid) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    await this.prisma.refreshToken.update({
      where: {
        id: storedToken.id,
      },
      data: {
        revokedAt: new Date(),
      },
    });

    const tokenUser: TokenUser = {
      id: storedToken.user.id,
      email: storedToken.user.email,
      fullName: storedToken.user.fullName,
    };

    const newAccessToken = await this.generateAccessToken(tokenUser);
    const newRefreshToken = await this.createRefreshToken(
      storedToken.user.id,
      userAgent,
      ipAddress,
    );

    return {
      message: 'Token refreshed successfully',
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
      user: tokenUser,
    };
  }

  async logout(refreshToken?: string) {
    if (!refreshToken) {
      return {
        message: 'Logged out successfully',
      };
    }

    try {
      const payload = await this.jwtService.verifyAsync<RefreshTokenPayload>(
        refreshToken,
        {
          secret: this.configService.getOrThrow<string>('JWT_REFRESH_SECRET'),
        },
      );

      await this.prisma.refreshToken.updateMany({
        where: {
          id: payload.tokenId,
          revokedAt: null,
        },
        data: {
          revokedAt: new Date(),
        },
      });
    } catch {
      // Không throw lỗi để logout vẫn thành công ở phía client
    }

    return {
      message: 'Logged out successfully',
    };
  }

  private async generateAccessToken(user: TokenUser) {
    const payload: AccessTokenPayload = {
      sub: user.id,
      email: user.email,
    };

    const jwtSecret =
      this.configService.getOrThrow<string>('JWT_ACCESS_SECRET');

    const jwtExpiresIn =
      this.configService.get<string>('JWT_ACCESS_EXPIRES_IN') ?? '15m';

    return this.jwtService.signAsync(payload, {
      secret: jwtSecret,
      expiresIn: jwtExpiresIn as StringValue,
    });
  }

  private async createRefreshToken(
    userId: string,
    userAgent?: string,
    ipAddress?: string,
  ) {
    const tokenId = randomUUID();

    const jwtSecret =
      this.configService.getOrThrow<string>('JWT_REFRESH_SECRET');

    const jwtExpiresIn =
      this.configService.get<string>('JWT_REFRESH_EXPIRES_IN') ?? '7d';

    const refreshToken = await this.jwtService.signAsync(
      {
        sub: userId,
        tokenId,
      },
      {
        secret: jwtSecret,
        expiresIn: jwtExpiresIn as StringValue,
      },
    );

    const tokenHash = await bcrypt.hash(refreshToken, 10);

    await this.prisma.refreshToken.create({
      data: {
        id: tokenId,
        userId,
        tokenHash,
        userAgent,
        ipAddress,
        expiresAt: this.getExpiresAt(jwtExpiresIn),
      },
    });

    return refreshToken;
  }

  private getExpiresAt(expiresIn: string) {
    const match = expiresIn.match(/^(\d+)([smhd])$/);

    if (!match) {
      return new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    }

    const value = Number(match[1]);
    const unit = match[2];

    const unitToMs: Record<string, number> = {
      s: 1000,
      m: 60 * 1000,
      h: 60 * 60 * 1000,
      d: 24 * 60 * 60 * 1000,
    };

    return new Date(Date.now() + value * unitToMs[unit]);
  }
}