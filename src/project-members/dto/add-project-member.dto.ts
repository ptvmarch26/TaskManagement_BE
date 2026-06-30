import { ProjectRole } from '@prisma/client';
import { IsEmail, IsEnum, IsOptional } from 'class-validator';

export class AddProjectMemberDto {
  @IsEmail()
  email!: string;

  @IsEnum(ProjectRole)
  @IsOptional()
  role?: ProjectRole;
}