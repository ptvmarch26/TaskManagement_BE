import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ProjectRole } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ProjectAccessService {
  constructor(private readonly prisma: PrismaService) {}

  async ensureProjectMember(userId: string, projectId: string) {
    const member = await this.prisma.projectMember.findUnique({
      where: {
        projectId_userId: {
          projectId,
          userId,
        },
      },
      include: {
        project: true,
      },
    });

    if (!member || member.project.isArchived) {
      throw new NotFoundException('Project not found');
    }

    return member;
  }

  async ensureProjectRole(
    userId: string,
    projectId: string,
    allowedRoles: ProjectRole[],
  ) {
    const member = await this.ensureProjectMember(userId, projectId);

    if (!allowedRoles.includes(member.role)) {
      throw new ForbiddenException('You do not have permission');
    }

    return member;
  }

  async ensureProjectOwner(userId: string, projectId: string) {
    return this.ensureProjectRole(userId, projectId, [ProjectRole.OWNER]);
  }

  async ensureProjectManagerOrOwner(userId: string, projectId: string) {
    return this.ensureProjectRole(userId, projectId, [
      ProjectRole.OWNER,
      ProjectRole.MANAGER,
    ]);
  }
}