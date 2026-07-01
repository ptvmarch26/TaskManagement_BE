import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AuditLogsService } from './audit-logs.service';

@ApiTags('Audit Logs')
@ApiBearerAuth()
@Controller('projects/:projectId/audit-logs')
@UseGuards(JwtAuthGuard)
export class AuditLogsController {
  constructor(private readonly auditLogsService: AuditLogsService) {}

  @ApiOperation({ summary: 'Get audit logs of a project' })
  @ApiParam({
    name: 'projectId',
    example: 'clxproject123',
  })
  @ApiResponse({ status: 200, description: 'Audit logs returned successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Only owner or manager can view audit logs' })
  @ApiResponse({ status: 404, description: 'Project not found' })
  @Get()
  findProjectAuditLogs(
    @CurrentUser('id') userId: string,
    @Param('projectId') projectId: string,
  ) {
    return this.auditLogsService.findProjectAuditLogs(userId, projectId);
  }
}