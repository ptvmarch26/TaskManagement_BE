import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ProjectRole } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';

@Injectable()
export class ProjectsService {
  constructor(private readonly prisma: PrismaService) {}

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
      projects: projects.map((project) => ({
        ...project,
        myRole: project.members[0]?.role,
        members: undefined,
      })),
    };
  }

  async findOne(userId: string, projectId: string) {
    await this.ensureProjectMember(userId, projectId);

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
    await this.ensureProjectOwner(userId, projectId);

    const project = await this.prisma.project.update({
      where: {
        id: projectId,
      },
      data: {
        name: dto.name?.trim(),
        description: dto.description?.trim(),
      },
    });

    return {
      message: 'Project updated successfully',
      project,
    };
  }

  async archive(userId: string, projectId: string) {
    await this.ensureProjectOwner(userId, projectId);

    await this.prisma.project.update({
      where: {
        id: projectId,
      },
      data: {
        isArchived: true,
      },
    });

    return {
      message: 'Project archived successfully',
    };
  }

  private async ensureProjectMember(userId: string, projectId: string) {
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

  private async ensureProjectOwner(userId: string, projectId: string) {
    const member = await this.ensureProjectMember(userId, projectId);

    if (member.role !== ProjectRole.OWNER) {
      throw new ForbiddenException('Only project owner can perform this action');
    }

    return member;
  }
}