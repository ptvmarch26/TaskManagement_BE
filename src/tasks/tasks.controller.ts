import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskStatusDto } from './dto/update-task-status.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { TasksService } from './tasks.service';

@ApiTags('Tasks')
@ApiBearerAuth()
@Controller()
@UseGuards(JwtAuthGuard)
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @ApiOperation({ summary: 'Create a task in a project' })
  @ApiParam({
    name: 'projectId',
    example: 'clxproject123',
  })
  @ApiResponse({ status: 201, description: 'Task created successfully' })
  @ApiResponse({ status: 400, description: 'Validation failed' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Viewer cannot create task' })
  @ApiResponse({ status: 404, description: 'Project or assignee not found' })
  @Post('projects/:projectId/tasks')
  create(
    @CurrentUser('id') userId: string,
    @Param('projectId') projectId: string,
    @Body() dto: CreateTaskDto,
  ) {
    return this.tasksService.create(userId, projectId, dto);
  }

  @ApiOperation({ summary: 'Get tasks in a project' })
  @ApiParam({
    name: 'projectId',
    example: 'clxproject123',
  })
  @ApiResponse({ status: 200, description: 'Project tasks returned successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Project not found' })
  @Get('projects/:projectId/tasks')
  findProjectTasks(
    @CurrentUser('id') userId: string,
    @Param('projectId') projectId: string,
  ) {
    return this.tasksService.findProjectTasks(userId, projectId);
  }

  @ApiOperation({ summary: 'Get task detail' })
  @ApiParam({
    name: 'taskId',
    example: 'clxtask123',
  })
  @ApiResponse({ status: 200, description: 'Task detail returned successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Task or project not found' })
  @Get('tasks/:taskId')
  findOne(@CurrentUser('id') userId: string, @Param('taskId') taskId: string) {
    return this.tasksService.findOne(userId, taskId);
  }

  @ApiOperation({ summary: 'Update task details' })
  @ApiParam({
    name: 'taskId',
    example: 'clxtask123',
  })
  @ApiResponse({ status: 200, description: 'Task updated successfully' })
  @ApiResponse({ status: 400, description: 'Validation failed' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'You cannot update this task' })
  @ApiResponse({ status: 404, description: 'Task or assignee not found' })
  @Patch('tasks/:taskId')
  update(
    @CurrentUser('id') userId: string,
    @Param('taskId') taskId: string,
    @Body() dto: UpdateTaskDto,
  ) {
    return this.tasksService.update(userId, taskId, dto);
  }

  @ApiOperation({ summary: 'Update task status' })
  @ApiParam({
    name: 'taskId',
    example: 'clxtask123',
  })
  @ApiResponse({ status: 200, description: 'Task status updated successfully' })
  @ApiResponse({ status: 400, description: 'Validation failed' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'You cannot update this task status' })
  @ApiResponse({ status: 404, description: 'Task not found' })
  @Patch('tasks/:taskId/status')
  updateStatus(
    @CurrentUser('id') userId: string,
    @Param('taskId') taskId: string,
    @Body() dto: UpdateTaskStatusDto,
  ) {
    return this.tasksService.updateStatus(userId, taskId, dto);
  }

  @ApiOperation({ summary: 'Delete a task' })
  @ApiParam({
    name: 'taskId',
    example: 'clxtask123',
  })
  @ApiResponse({ status: 200, description: 'Task deleted successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Only owner or manager can delete task' })
  @ApiResponse({ status: 404, description: 'Task not found' })
  @Delete('tasks/:taskId')
  remove(@CurrentUser('id') userId: string, @Param('taskId') taskId: string) {
    return this.tasksService.remove(userId, taskId);
  }
}