import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { NotificationType, ProjectRole } from '@prisma/client';
import { NotificationsService } from '../notifications/notifications.service';
import { PrismaService } from '../../prisma/prisma.service';
import { ProjectAccessService } from '../projects/project-access.service';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { AddProjectMemberDto } from './dto/add-project-member.dto';
import { UpdateProjectMemberRoleDto } from './dto/update-project-member-role.dto';

@Injectable()
export class ProjectMembersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly projectAccessService: ProjectAccessService,
    private readonly auditLogsService: AuditLogsService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async findMembers(userId: string, projectId: string) {
    await this.projectAccessService.ensureProjectMember(userId, projectId);

    const members = await this.prisma.projectMember.findMany({
      where: {
        projectId,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            fullName: true,
            avatarUrl: true,
          },
        },
      },
      orderBy: {
        joinedAt: 'asc',
      },
    });

    return {
      members,
    };
  }

  async addMember(userId: string, projectId: string, dto: AddProjectMemberDto) {
    const actorMember =
      await this.projectAccessService.ensureProjectManagerOrOwner(
        userId,
        projectId,
      );

    const targetRole = dto.role ?? ProjectRole.MEMBER;

    if (targetRole === ProjectRole.OWNER) {
      throw new BadRequestException('Cannot add member as OWNER');
    }

    if (
      actorMember.role === ProjectRole.MANAGER &&
      targetRole === ProjectRole.MANAGER
    ) {
      throw new ForbiddenException('Manager cannot add another manager');
    }

    const targetUser = await this.prisma.user.findUnique({
      where: {
        email: dto.email.toLowerCase().trim(),
      },
      select: {
        id: true,
        email: true,
        fullName: true,
        avatarUrl: true,
      },
    });

    if (!targetUser) {
      throw new NotFoundException('User not found');
    }

    const existingMember = await this.prisma.projectMember.findUnique({
      where: {
        projectId_userId: {
          projectId,
          userId: targetUser.id,
        },
      },
    });

    if (existingMember) {
      throw new ConflictException('User is already a project member');
    }

    const member = await this.prisma.projectMember.create({
      data: {
        projectId,
        userId: targetUser.id,
        role: targetRole,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            fullName: true,
            avatarUrl: true,
          },
        },
        project: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    await this.auditLogsService.createLog({
      projectId,
      actorId: userId,
      action: 'MEMBER_ADDED',
      entity: 'ProjectMember',
      entityId: member.id,
      newValue: {
        userId: member.userId,
        email: member.user.email,
        role: member.role,
      },
    });

    await this.notificationsService.createNotification({
      userId: targetUser.id,
      projectId,
      type: NotificationType.MEMBER_ADDED,
      title: 'You were added to a project',
      message: `You were added to project "${member.project.name}" as ${member.role}.`,
    });

    return {
      message: 'Member added successfully',
      member,
    };
  }

  async updateMemberRole(
    userId: string,
    projectId: string,
    targetUserId: string,
    dto: UpdateProjectMemberRoleDto,
  ) {
    await this.projectAccessService.ensureProjectOwner(userId, projectId);

    if (dto.role === ProjectRole.OWNER) {
      throw new BadRequestException('Cannot assign OWNER role here');
    }

    const targetMember = await this.prisma.projectMember.findUnique({
      where: {
        projectId_userId: {
          projectId,
          userId: targetUserId,
        },
      },
    });

    if (!targetMember) {
      throw new NotFoundException('Member not found');
    }

    if (targetMember.role === ProjectRole.OWNER) {
      throw new BadRequestException('Cannot change owner role');
    }

    if (targetMember.role === dto.role) {
      return {
        message: 'Member role is already up to date',
        member: targetMember,
      };
    }

    const member = await this.prisma.projectMember.update({
      where: {
        projectId_userId: {
          projectId,
          userId: targetUserId,
        },
      },
      data: {
        role: dto.role,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            fullName: true,
            avatarUrl: true,
          },
        },
      },
    });

    await this.auditLogsService.createLog({
      projectId,
      actorId: userId,
      action: 'MEMBER_ROLE_UPDATED',
      entity: 'ProjectMember',
      entityId: member.id,
      oldValue: {
        userId: targetMember.userId,
        role: targetMember.role,
      },
      newValue: {
        userId: member.userId,
        role: member.role,
      },
    });

    return {
      message: 'Member role updated successfully',
      member,
    };
  }

  async removeMember(userId: string, projectId: string, targetUserId: string) {
    const actorMember =
      await this.projectAccessService.ensureProjectManagerOrOwner(
        userId,
        projectId,
      );

    const targetMember = await this.prisma.projectMember.findUnique({
      where: {
        projectId_userId: {
          projectId,
          userId: targetUserId,
        },
      },
    });

    if (!targetMember) {
      throw new NotFoundException('Member not found');
    }

    if (targetMember.role === ProjectRole.OWNER) {
      throw new BadRequestException('Cannot remove project owner');
    }

    if (targetMember.userId === userId) {
      throw new BadRequestException('Cannot remove yourself');
    }

    if (
      actorMember.role === ProjectRole.MANAGER &&
      targetMember.role === ProjectRole.MANAGER
    ) {
      throw new ForbiddenException('Manager cannot remove another manager');
    }

    await this.prisma.projectMember.delete({
      where: {
        projectId_userId: {
          projectId,
          userId: targetUserId,
        },
      },
    });

    await this.auditLogsService.createLog({
      projectId,
      actorId: userId,
      action: 'MEMBER_REMOVED',
      entity: 'ProjectMember',
      entityId: targetMember.id,
      oldValue: {
        userId: targetMember.userId,
        role: targetMember.role,
      },
    });

    return {
      message: 'Member removed successfully',
    };
  }
}
