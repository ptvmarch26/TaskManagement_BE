import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AuditLogsService } from './audit-logs.service';

@Controller('projects/:projectId/audit-logs')
@UseGuards(JwtAuthGuard)
export class AuditLogsController {
  constructor(private readonly auditLogsService: AuditLogsService) {}

  @Get()
  findProjectAuditLogs(
    @CurrentUser('id') userId: string,
    @Param('projectId') projectId: string,
  ) {
    return this.auditLogsService.findProjectAuditLogs(userId, projectId);
  }
}