import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ProjectRole } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { ProjectAccessService } from '../projects/project-access.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';

@Injectable()
export class CommentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly projectAccessService: ProjectAccessService,
  ) {}

  async findTaskComments(userId: string, taskId: string) {
    const task = await this.findTaskOrThrow(taskId);

    await this.projectAccessService.ensureProjectMember(userId, task.projectId);

    const comments = await this.prisma.comment.findMany({
      where: {
        taskId,
      },
      include: this.commentInclude(),
      orderBy: {
        createdAt: 'asc',
      },
    });

    return {
      comments,
    };
  }

  async create(userId: string, taskId: string, dto: CreateCommentDto) {
    const task = await this.findTaskOrThrow(taskId);

    const actorMember = await this.projectAccessService.ensureProjectMember(
      userId,
      task.projectId,
    );

    if (actorMember.role === ProjectRole.VIEWER) {
      throw new ForbiddenException('Viewer cannot comment');
    }

    const comment = await this.prisma.comment.create({
      data: {
        taskId,
        authorId: userId,
        content: dto.content.trim(),
      },
      include: this.commentInclude(),
    });

    return {
      message: 'Comment created successfully',
      comment,
    };
  }

  async update(userId: string, commentId: string, dto: UpdateCommentDto) {
    const comment = await this.findCommentOrThrow(commentId);

    const actorMember = await this.projectAccessService.ensureProjectMember(
      userId,
      comment.task.projectId,
    );

    if (actorMember.role === ProjectRole.VIEWER) {
      throw new ForbiddenException('Viewer cannot update comment');
    }

    if (comment.authorId !== userId) {
      throw new ForbiddenException('Only comment author can update comment');
    }

    const updatedComment = await this.prisma.comment.update({
      where: {
        id: commentId,
      },
      data: {
        content: dto.content.trim(),
      },
      include: this.commentInclude(),
    });

    return {
      message: 'Comment updated successfully',
      comment: updatedComment,
    };
  }

  async remove(userId: string, commentId: string) {
    const comment = await this.findCommentOrThrow(commentId);

    const actorMember = await this.projectAccessService.ensureProjectMember(
      userId,
      comment.task.projectId,
    );

    if (actorMember.role === ProjectRole.VIEWER) {
      throw new ForbiddenException('Viewer cannot delete comment');
    }

    const isOwnerOrManager =
      actorMember.role === ProjectRole.OWNER ||
      actorMember.role === ProjectRole.MANAGER;

    const isAuthor = comment.authorId === userId;

    if (!isOwnerOrManager && !isAuthor) {
      throw new ForbiddenException('You cannot delete this comment');
    }

    await this.prisma.comment.delete({
      where: {
        id: commentId,
      },
    });

    return {
      message: 'Comment deleted successfully',
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
      select: {
        id: true,
        projectId: true,
      },
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    return task;
  }

  private async findCommentOrThrow(commentId: string) {
    const comment = await this.prisma.comment.findFirst({
      where: {
        id: commentId,
        task: {
          project: {
            isArchived: false,
          },
        },
      },
      include: {
        task: {
          select: {
            id: true,
            projectId: true,
          },
        },
        author: {
          select: {
            id: true,
            email: true,
            fullName: true,
            avatarUrl: true,
          },
        },
      },
    });

    if (!comment) {
      throw new NotFoundException('Comment not found');
    }

    return comment;
  }

  private commentInclude() {
    return {
      author: {
        select: {
          id: true,
          email: true,
          fullName: true,
          avatarUrl: true,
        },
      },
      task: {
        select: {
          id: true,
          title: true,
          projectId: true,
        },
      },
    };
  }
}