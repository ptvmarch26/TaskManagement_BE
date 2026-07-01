import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, ProjectRole } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { ProjectAccessService } from './project-access.service';

@Injectable()
export class ProjectsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly projectAccessService: ProjectAccessService,
  ) {}

  async create(userId: string, dto: CreateProjectDto) {
    const project = await this.prisma.project.create({
      data: {
        name: dto.name.trim(),
        description: dto.description?.trim(),
        ownerId: userId,
        members: {
          create: {
            userId,
            role: ProjectRole.OWNER,
          },
        },
      },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                fullName: true,
              },
            },
          },
        },
      },
    });

    await this.createProjectAuditLog({
      projectId: project.id,
      actorId: userId,
      action: 'PROJECT_CREATED',
      entity: 'Project',
      entityId: project.id,
      newValue: {
        name: project.name,
        description: project.description,
        ownerId: project.ownerId,
      },
    });

    return {
      message: 'Project created successfully',
      project,
    };
  }

  async findMyProjects(userId: string) {
    const projects = await this.prisma.project.findMany({
      where: {
        isArchived: false,
        members: {
          some: {
            userId,
          },
        },
      },
      include: {
        owner: {
          select: {
            id: true,
            email: true,
            fullName: true,
          },
        },
        members: {
          where: {
            userId,
          },
          select: {
            role: true,
            joinedAt: true,
          },
        },
        _count: {
          select: {
            members: true,
            tasks: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return {
      projects: projects.map((project) => {
        const { members, ...rest } = project;

        return {
          ...rest,
          myRole: members[0]?.role,
        };
      }),
    };
  }

  async findOne(userId: string, projectId: string) {
    await this.projectAccessService.ensureProjectMember(userId, projectId);

    const project = await this.prisma.project.findFirst({
      where: {
        id: projectId,
        isArchived: false,
      },
      include: {
        owner: {
          select: {
            id: true,
            email: true,
            fullName: true,
          },
        },
        members: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                fullName: true,
              },
            },
          },
          orderBy: {
            joinedAt: 'asc',
          },
        },
        _count: {
          select: {
            tasks: true,
            auditLogs: true,
          },
        },
      },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    return {
      project,
    };
  }

  async update(userId: string, projectId: string, dto: UpdateProjectDto) {
    const ownerMember = await this.projectAccessService.ensureProjectOwner(
      userId,
      projectId,
    );

    const oldProject = ownerMember.project;

    const project = await this.prisma.project.update({
      where: {
        id: projectId,
      },
      data: {
        name: dto.name?.trim(),
        description: dto.description?.trim(),
      },
    });

    await this.createProjectAuditLog({
      projectId,
      actorId: userId,
      action: 'PROJECT_UPDATED',
      entity: 'Project',
      entityId: projectId,
      oldValue: {
        name: oldProject.name,
        description: oldProject.description,
      },
      newValue: {
        name: project.name,
        description: project.description,
      },
    });

    return {
      message: 'Project updated successfully',
      project,
    };
  }

  async archive(userId: string, projectId: string) {
    const ownerMember = await this.projectAccessService.ensureProjectOwner(
      userId,
      projectId,
    );

    const oldProject = ownerMember.project;

    const project = await this.prisma.project.update({
      where: {
        id: projectId,
      },
      data: {
        isArchived: true,
      },
    });

    await this.createProjectAuditLog({
      projectId,
      actorId: userId,
      action: 'PROJECT_ARCHIVED',
      entity: 'Project',
      entityId: projectId,
      oldValue: {
        name: oldProject.name,
        description: oldProject.description,
        isArchived: oldProject.isArchived,
      },
      newValue: {
        name: project.name,
        description: project.description,
        isArchived: project.isArchived,
      },
    });

    return {
      message: 'Project archived successfully',
    };
  }

  private async createProjectAuditLog(params: {
    projectId: string;
    actorId: string;
    action: string;
    entity: string;
    entityId?: string;
    oldValue?: Prisma.InputJsonValue;
    newValue?: Prisma.InputJsonValue;
  }) {
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
}