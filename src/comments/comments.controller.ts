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
import { CommentsService } from './comments.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';

@ApiTags('Comments')
@ApiBearerAuth()
@Controller()
@UseGuards(JwtAuthGuard)
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  @ApiOperation({ summary: 'Get comments of a task' })
  @ApiParam({
    name: 'taskId',
    example: 'clxtask123',
  })
  @ApiResponse({
    status: 200,
    description: 'Task comments returned successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Task or project not found' })
  @Get('tasks/:taskId/comments')
  findTaskComments(
    @CurrentUser('id') userId: string,
    @Param('taskId') taskId: string,
  ) {
    return this.commentsService.findTaskComments(userId, taskId);
  }

  @ApiOperation({ summary: 'Create a comment on a task' })
  @ApiParam({
    name: 'taskId',
    example: 'clxtask123',
  })
  @ApiResponse({ status: 201, description: 'Comment created successfully' })
  @ApiResponse({ status: 400, description: 'Validation failed' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Viewer cannot comment' })
  @ApiResponse({ status: 404, description: 'Task or project not found' })
  @Post('tasks/:taskId/comments')
  create(
    @CurrentUser('id') userId: string,
    @Param('taskId') taskId: string,
    @Body() dto: CreateCommentDto,
  ) {
    return this.commentsService.create(userId, taskId, dto);
  }

  @ApiOperation({ summary: 'Update a comment' })
  @ApiParam({
    name: 'commentId',
    example: 'clxcomment123',
  })
  @ApiResponse({ status: 200, description: 'Comment updated successfully' })
  @ApiResponse({ status: 400, description: 'Validation failed' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 403,
    description: 'Only comment author can update comment',
  })
  @ApiResponse({ status: 404, description: 'Comment or project not found' })
  @Patch('comments/:commentId')
  update(
    @CurrentUser('id') userId: string,
    @Param('commentId') commentId: string,
    @Body() dto: UpdateCommentDto,
  ) {
    return this.commentsService.update(userId, commentId, dto);
  }

  @ApiOperation({ summary: 'Delete a comment' })
  @ApiParam({
    name: 'commentId',
    example: 'clxcomment123',
  })
  @ApiResponse({ status: 200, description: 'Comment deleted successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'You cannot delete this comment' })
  @ApiResponse({ status: 404, description: 'Comment or project not found' })
  @Delete('comments/:commentId')
  remove(
    @CurrentUser('id') userId: string,
    @Param('commentId') commentId: string,
  ) {
    return this.commentsService.remove(userId, commentId);
  }
}
