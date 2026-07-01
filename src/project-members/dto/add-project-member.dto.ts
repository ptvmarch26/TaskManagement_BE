import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ProjectRole } from '@prisma/client';
import { IsEmail, IsEnum, IsOptional } from 'class-validator';

export class AddProjectMemberDto {
  @ApiProperty({
    example: 'member@example.com',
  })
  @IsEmail()
  email!: string;

  @ApiPropertyOptional({
    enum: ProjectRole,
    example: ProjectRole.MEMBER,
    description: 'If omitted, role defaults to MEMBER',
  })
  @IsEnum(ProjectRole)
  @IsOptional()
  role?: ProjectRole;
}