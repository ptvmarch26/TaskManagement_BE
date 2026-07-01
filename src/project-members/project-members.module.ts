import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { ProjectsModule } from '../projects/projects.module';
import { ProjectMembersController } from './project-members.controller';
import { ProjectMembersService } from './project-members.service';
import { AuditLogsModule } from '../audit-logs/audit-logs.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [AuthModule, ProjectsModule, AuditLogsModule, NotificationsModule],
  controllers: [ProjectMembersController],
  providers: [ProjectMembersService],
})
export class ProjectMembersModule {}