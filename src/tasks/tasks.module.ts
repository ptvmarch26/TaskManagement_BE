import { Module } from '@nestjs/common';
import { AuditLogsModule } from '../audit-logs/audit-logs.module';
import { AuthModule } from '../auth/auth.module';
import { ProjectsModule } from '../projects/projects.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { TasksController } from './tasks.controller';
import { TasksService } from './tasks.service';

@Module({
  imports: [AuthModule, ProjectsModule, AuditLogsModule, NotificationsModule],
  controllers: [TasksController],
  providers: [TasksService],
})
export class TasksModule {}