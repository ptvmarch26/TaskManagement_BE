import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ProjectRole, TaskStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { ProjectAccessService } from '../projects/project-access.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskStatusDto } from './dto/update-task-status.dto';
import { UpdateTaskDto } from './dto/update-task.dto';

@Injectable()
export class TasksService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly projectAccessService: ProjectAccessService,
  ) {}

  async create(userId: string, projectId: string, dto: CreateTaskDto) {
    const actorMember = await this.projectAccessService.ensureProjectMember(
      userId,
      projectId,
    );

    if (actorMember.role === ProjectRole.VIEWER) {
      throw new ForbiddenException('Viewer cannot create task');
    }

    if (dto.assigneeId) {
      await this.ensureAssigneeIsProjectMember(projectId, dto.assigneeId);
    }


    const task = await this.prisma.task.create({
      data: {
        projectId,
        title: dto.title.trim(),
        description: dto.description?.trim(),
        priority: dto.priority,
        dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
        creatorId: userId,
        assigneeId: dto.assigneeId,
      },
      include: this.taskInclude(),
    });

    return {
      message: 'Task created successfully',
      task,
    };
  }

  async findProjectTasks(userId: string, projectId: string) {
    await this.projectAccessService.ensureProjectMember(userId, projectId);

    const tasks = await this.prisma.task.findMany({
      where: {
        projectId,
        project: {
          isArchived: false,
        },
      },
      include: this.taskInclude(),
      orderBy: {
        createdAt: 'desc',
      },
    });

    return {
      tasks,
    };
  }

  async findOne(userId: string, taskId: string) {
    const task = await this.findTaskOrThrow(taskId);

    await this.projectAccessService.ensureProjectMember(
      userId,
      task.projectId,
    );

    return {
      task,
    };
  }

  async update(userId: string, taskId: string, dto: UpdateTaskDto) {
    const task = await this.findTaskOrThrow(taskId);

    const actorMember = await this.projectAccessService.ensureProjectMember(
      userId,
      task.projectId,
    );

    const isOwnerOrManager =
      actorMember.role === ProjectRole.OWNER ||
      actorMember.role === ProjectRole.MANAGER;

    const isCreator = task.creatorId === userId;
    const isAssignee = task.assigneeId === userId;

    if (!isOwnerOrManager && !isCreator && !isAssignee) {
      throw new ForbiddenException('You cannot update this task');
    }

    if (actorMember.role === ProjectRole.VIEWER) {
      throw new ForbiddenException('Viewer cannot update task');
    }

    if (!isOwnerOrManager && dto.assigneeId) {
      throw new ForbiddenException('Only owner or manager can assign task');
    }

    if (dto.assigneeId) {
      await this.ensureAssigneeIsProjectMember(task.projectId, dto.assigneeId);
    }

    const updatedTask = await this.prisma.task.update({
      where: {
        id: taskId,
      },
      data: {
        title: dto.title?.trim(),
        description: dto.description?.trim(),
        priority: dto.priority,
        dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
        assigneeId: dto.assigneeId,
      },
      include: this.taskInclude(),
    });

    return {
      message: 'Task updated successfully',
      task: updatedTask,
    };
  }

  async updateStatus(
    userId: string,
    taskId: string,
    dto: UpdateTaskStatusDto,
  ) {
    const task = await this.findTaskOrThrow(taskId);

    const actorMember = await this.projectAccessService.ensureProjectMember(
      userId,
      task.projectId,
    );

    const isOwnerOrManager =
      actorMember.role === ProjectRole.OWNER ||
      actorMember.role === ProjectRole.MANAGER;

    const isAssignee = task.assigneeId === userId;

    if (actorMember.role === ProjectRole.VIEWER) {
      throw new ForbiddenException('Viewer cannot update task status');
    }

    if (!isOwnerOrManager && !isAssignee) {
      throw new ForbiddenException('You cannot update this task status');
    }

    const updatedTask = await this.prisma.task.update({
      where: {
        id: taskId,
      },
      data: {
        status: dto.status,
      },
      include: this.taskInclude(),
    });

    return {
      message: 'Task status updated successfully',
      task: updatedTask,
    };
  }

  async remove(userId: string, taskId: string) {
    const task = await this.findTaskOrThrow(taskId);

    await this.projectAccessService.ensureProjectRole(userId, task.projectId, [
      ProjectRole.OWNER,
      ProjectRole.MANAGER,
    ]);

    await this.prisma.task.delete({
      where: {
        id: taskId,
      },
    });

    return {
      message: 'Task deleted successfully',
    };
  }

  private async findTaskOrThrow(taskId: string) {
    const task = await this.prisma.task.findFirst({
      where: {
        id: taskId,
        project: {
          isArchived: false,
        },
      },
      include: this.taskInclude(),
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    return task;
  }

  private async ensureAssigneeIsProjectMember(
    projectId: string,
    assigneeId: string,
  ) {
    const assigneeMember = await this.prisma.projectMember.findUnique({
      where: {
        projectId_userId: {
          projectId,
          userId: assigneeId,
        },
      },
    });

    if (!assigneeMember) {
      throw new NotFoundException('Assignee is not a project member');
    }

    return assigneeMember;
  }

  private taskInclude() {
    return {
      creator: {
        select: {
          id: true,
          email: true,
          fullName: true,
          avatarUrl: true,
        },
      },
      assignee: {
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
          isArchived: true,
        },
      },
      _count: {
        select: {
          comments: true,
        },
      },
    };
  }
}