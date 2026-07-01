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
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AddProjectMemberDto } from './dto/add-project-member.dto';
import { UpdateProjectMemberRoleDto } from './dto/update-project-member-role.dto';
import { ProjectMembersService } from './project-members.service';

@ApiTags('Project Members')
@ApiBearerAuth()
@Controller('projects/:projectId/members')
@UseGuards(JwtAuthGuard)
export class ProjectMembersController {
  constructor(private readonly projectMembersService: ProjectMembersService) {}

  @ApiOperation({ summary: 'Get all members in a project' })
  @ApiParam({
    name: 'projectId',
    example: 'clxproject123',
  })
  @ApiResponse({ status: 200, description: 'Project members returned successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Project not found' })
  @Get()
  findMembers(
    @CurrentUser('id') userId: string,
    @Param('projectId') projectId: string,
  ) {
    return this.projectMembersService.findMembers(userId, projectId);
  }

  @ApiOperation({ summary: 'Add a user to a project' })
  @ApiParam({
    name: 'projectId',
    example: 'clxproject123',
  })
  @ApiResponse({ status: 201, description: 'Member added successfully' })
  @ApiResponse({ status: 400, description: 'Cannot add member as OWNER or validation failed' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'You do not have permission' })
  @ApiResponse({ status: 404, description: 'Project or user not found' })
  @ApiResponse({ status: 409, description: 'User is already a project member' })
  @Post()
  addMember(
    @CurrentUser('id') userId: string,
    @Param('projectId') projectId: string,
    @Body() dto: AddProjectMemberDto,
  ) {
    return this.projectMembersService.addMember(userId, projectId, dto);
  }

  @ApiOperation({ summary: 'Update a project member role' })
  @ApiParam({
    name: 'projectId',
    example: 'clxproject123',
  })
  @ApiParam({
    name: 'targetUserId',
    example: 'clxuser123',
    description: 'User ID of the project member whose role will be updated',
  })
  @ApiResponse({ status: 200, description: 'Member role updated successfully' })
  @ApiResponse({ status: 400, description: 'Cannot assign OWNER role or change owner role' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Only project owner can update member role' })
  @ApiResponse({ status: 404, description: 'Project or member not found' })
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

  @ApiOperation({ summary: 'Remove a member from a project' })
  @ApiParam({
    name: 'projectId',
    example: 'clxproject123',
  })
  @ApiParam({
    name: 'targetUserId',
    example: 'clxuser123',
    description: 'User ID of the project member to remove',
  })
  @ApiResponse({ status: 200, description: 'Member removed successfully' })
  @ApiResponse({ status: 400, description: 'Cannot remove owner or yourself' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'You do not have permission' })
  @ApiResponse({ status: 404, description: 'Project or member not found' })
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