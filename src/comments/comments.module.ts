import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { ProjectsModule } from '../projects/projects.module';
import { AuditLogsModule } from '../audit-logs/audit-logs.module';
import { CommentsController } from './comments.controller';
import { CommentsService } from './comments.service';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [AuthModule, ProjectsModule, AuditLogsModule, NotificationsModule],
  controllers: [CommentsController],
  providers: [CommentsService],
})
export class CommentsModule {}