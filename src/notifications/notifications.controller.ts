import { Controller, Get, Param, Patch, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { NotificationsService } from './notifications.service';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  findMyNotifications(@CurrentUser('id') userId: string) {
    return this.notificationsService.findMyNotifications(userId);
  }

  @Patch('read-all')
  markAllAsRead(@CurrentUser('id') userId: string) {
    return this.notificationsService.markAllAsRead(userId);
  }

  @Patch(':notificationId/read')
  markAsRead(
    @CurrentUser('id') userId: string,
    @Param('notificationId') notificationId: string,
  ) {
    return this.notificationsService.markAsRead(userId, notificationId);
  }
}