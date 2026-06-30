import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Request, Response } from 'express';

import { AuthService } from './auth.service';
import { CurrentUser } from './decorators/current-user.decorator';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import type { AuthUser } from './types/auth-user.type';

type RequestWithCookies = Request & {
  cookies?: {
    refreshToken?: string;
  };
};

@Controller('auth')
export class AuthController {
  private readonly refreshTokenCookieName = 'refreshToken';

  constructor(private readonly authService: AuthService) {}

  @Post('register')
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @HttpCode(HttpStatus.OK)
  @Post('login')
  async login(
    @Body() dto: LoginDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.login(
      dto,
      req.headers['user-agent'],
      req.ip,
    );

    this.setRefreshTokenCookie(res, result.refreshToken);

    return {
      message: result.message,
      accessToken: result.accessToken,
      user: result.user,
    };
  }

  @HttpCode(HttpStatus.OK)
  @Post('refresh')
  async refresh(
    @Req() req: RequestWithCookies,
    @Res({ passthrough: true }) res: Response,
  ) {
    const refreshToken = req.cookies?.[this.refreshTokenCookieName];

    const result = await this.authService.refresh(
      refreshToken ?? '',
      req.headers['user-agent'],
      req.ip,
    );

    this.setRefreshTokenCookie(res, result.refreshToken);

    return {
      message: result.message,
      accessToken: result.accessToken,
      user: result.user,
    };
  }

  @HttpCode(HttpStatus.OK)
  @Post('logout')
  async logout(
    @Req() req: RequestWithCookies,
    @Res({ passthrough: true }) res: Response,
  ) {
    const refreshToken = req.cookies?.[this.refreshTokenCookieName];

    const result = await this.authService.logout(refreshToken);

    this.clearRefreshTokenCookie(res);

    return result;
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  getMe(@CurrentUser() user: AuthUser) {
    return {
      user,
    };
  }

  private setRefreshTokenCookie(res: Response, refreshToken: string) {
    res.cookie(this.refreshTokenCookieName, refreshToken, {
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
      path: '/auth',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
  }

  private clearRefreshTokenCookie(res: Response) {
    res.clearCookie(this.refreshTokenCookieName, {
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
      path: '/auth',
    });
  }
}