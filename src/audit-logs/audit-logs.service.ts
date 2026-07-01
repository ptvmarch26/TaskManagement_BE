import { Injectable } from '@nestjs/common';
import { Prisma, ProjectRole } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { ProjectAccessService } from '../projects/project-access.service';

type CreateAuditLogParams = {
  projectId: string;
  actorId: string;
  action: string;
  entity: string;
  entityId?: string;
  oldValue?: Prisma.InputJsonValue;
  newValue?: Prisma.InputJsonValue;
};

@Injectable()
export class AuditLogsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly projectAccessService: ProjectAccessService,
  ) {}

  async createLog(params: CreateAuditLogParams) {
    return this.prisma.auditLog.create({
      data: {
        projectId: params.projectId,
        actorId: params.actorId,
        action: params.action,
        entity: params.entity,
        entityId: params.entityId,
        oldValue: params.oldValue,
        newValue: params.newValue,
      },
    });
  }

  async findProjectAuditLogs(userId: string, projectId: string) {
    await this.projectAccessService.ensureProjectRole(userId, projectId, [
      ProjectRole.OWNER,
      ProjectRole.MANAGER,
    ]);

    const auditLogs = await this.prisma.auditLog.findMany({
      where: {
        projectId,
      },
      include: {
        actor: {
          select: {
            id: true,
            email: true,
            fullName: true,
            avatarUrl: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return {
      auditLogs,
    };
  }
}