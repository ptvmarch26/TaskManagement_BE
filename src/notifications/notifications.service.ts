import { Injectable, NotFoundException } from '@nestjs/common';
import { NotificationType } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

type CreateNotificationParams = {
  userId: string;
  projectId?: string;
  taskId?: string;
  type: NotificationType;
  title: string;
  message: string;
};

@Injectable()
export class NotificationsService {
  constructor(private readonly prisma: PrismaService) {}

  async createNotification(params: CreateNotificationParams) {
    return this.prisma.notification.create({
      data: {
        userId: params.userId,
        projectId: params.projectId,
        taskId: params.taskId,
        type: params.type,
        title: params.title,
        message: params.message,
      },
    });
  }

  async createManyNotifications(params: CreateNotificationParams[]) {
    if (params.length === 0) {
      return;
    }

    return this.prisma.notification.createMany({
      data: params.map((item) => ({
        userId: item.userId,
        projectId: item.projectId,
        taskId: item.taskId,
        type: item.type,
        title: item.title,
        message: item.message,
      })),
    });
  }

  async findMyNotifications(userId: string) {
    const [notifications, unreadCount] = await Promise.all([
      this.prisma.notification.findMany({
        where: {
          userId,
        },
        include: {
          project: {
            select: {
              id: true,
              name: true,
            },
          },
          task: {
            select: {
              id: true,
              title: true,
              status: true,
              priority: true,
            },
          },
        },
        orderBy: [
          {
            isRead: 'asc',
          },
          {
            createdAt: 'desc',
          },
        ],
      }),
      this.prisma.notification.count({
        where: {
          userId,
          isRead: false,
        },
      }),
    ]);

    return {
      unreadCount,
      notifications,
    };
  }

  async markAsRead(userId: string, notificationId: string) {
    const notification = await this.prisma.notification.findUnique({
      where: {
        id: notificationId,
      },
    });

    if (!notification || notification.userId !== userId) {
      throw new NotFoundException('Notification not found');
    }

    const updatedNotification = await this.prisma.notification.update({
      where: {
        id: notificationId,
      },
      data: {
        isRead: true,
      },
    });

    return {
      message: 'Notification marked as read',
      notification: updatedNotification,
    };
  }

  async markAllAsRead(userId: string) {
    await this.prisma.notification.updateMany({
      where: {
        userId,
        isRead: false,
      },
      data: {
        isRead: true,
      },
    });

    return {
      message: 'All notifications marked as read',
    };
  }
}
