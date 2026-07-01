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
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskStatusDto } from './dto/update-task-status.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { TasksService } from './tasks.service';

@Controller()
@UseGuards(JwtAuthGuard)
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Post('projects/:projectId/tasks')
  create(
    @CurrentUser('id') userId: string,
    @Param('projectId') projectId: string,
    @Body() dto: CreateTaskDto,
  ) {
    return this.tasksService.create(userId, projectId, dto);
  }

  @Get('projects/:projectId/tasks')
  findProjectTasks(
    @CurrentUser('id') userId: string,
    @Param('projectId') projectId: string,
  ) {
    return this.tasksService.findProjectTasks(userId, projectId);
  }

  @Get('tasks/:taskId')
  findOne(@CurrentUser('id') userId: string, @Param('taskId') taskId: string) {
    return this.tasksService.findOne(userId, taskId);
  }

  @Patch('tasks/:taskId')
  update(
    @CurrentUser('id') userId: string,
    @Param('taskId') taskId: string,
    @Body() dto: UpdateTaskDto,
  ) {
    return this.tasksService.update(userId, taskId, dto);
  }

  @Patch('tasks/:taskId/status')
  updateStatus(
    @CurrentUser('id') userId: string,
    @Param('taskId') taskId: string,
    @Body() dto: UpdateTaskStatusDto,
  ) {
    return this.tasksService.updateStatus(userId, taskId, dto);
  }

  @Delete('tasks/:taskId')
  remove(@CurrentUser('id') userId: string, @Param('taskId') taskId: string) {
    return this.tasksService.remove(userId, taskId);
  }
}
