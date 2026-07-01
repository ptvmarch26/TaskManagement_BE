import { ApiProperty } from '@nestjs/swagger';
import { ProjectRole } from '@prisma/client';
import { IsEnum } from 'class-validator';

export class UpdateProjectMemberRoleDto {
  @ApiProperty({
    enum: ProjectRole,
    example: ProjectRole.MANAGER,
  })
  @IsEnum(ProjectRole)
  role!: ProjectRole;
}