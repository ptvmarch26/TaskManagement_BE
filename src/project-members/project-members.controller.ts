import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AddProjectMemberDto } from './dto/add-project-member.dto';
import { UpdateProjectMemberRoleDto } from './dto/update-project-member-role.dto';
import { ProjectMembersService } from './project-members.service';

@Controller('projects/:projectId/members')
@UseGuards(JwtAuthGuard)
export class ProjectMembersController {
  constructor(private readonly projectMembersService: ProjectMembersService) {}

  @Get()
  findMembers(
    @CurrentUser('id') userId: string,
    @Param('projectId') projectId: string,
  ) {
    return this.projectMembersService.findMembers(userId, projectId);
  }

  @Post()
  addMember(
    @CurrentUser('id') userId: string,
    @Param('projectId') projectId: string,
    @Body() dto: AddProjectMemberDto,
  ) {
    return this.projectMembersService.addMember(userId, projectId, dto);
  }

  @Patch(':targetUserId/role')
  updateMemberRole(
    @CurrentUser('id') userId: string,
    @Param('projectId') projectId: string,
    @Param('targetUserId') targetUserId: string,
    @Body() dto: UpdateProjectMemberRoleDto,
  ) {
    return this.projectMembersService.updateMemberRole(
      userId,
      projectId,
      targetUserId,
      dto,
    );
  }

  @Delete(':targetUserId')
  removeMember(
    @CurrentUser('id') userId: string,
    @Param('projectId') projectId: string,
    @Param('targetUserId') targetUserId: string,
  ) {
    return this.projectMembersService.removeMember(
      userId,
      projectId,
      targetUserId,
    );
  }
}
