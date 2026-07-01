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
import { CommentsService } from './comments.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';

@Controller()
@UseGuards(JwtAuthGuard)
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  @Get('tasks/:taskId/comments')
  findTaskComments(
    @CurrentUser('id') userId: string,
    @Param('taskId') taskId: string,
  ) {
    return this.commentsService.findTaskComments(userId, taskId);
  }

  @Post('tasks/:taskId/comments')
  create(
    @CurrentUser('id') userId: string,
    @Param('taskId') taskId: string,
    @Body() dto: CreateCommentDto,
  ) {
    return this.commentsService.create(userId, taskId, dto);
  }

  @Patch('comments/:commentId')
  update(
    @CurrentUser('id') userId: string,
    @Param('commentId') commentId: string,
    @Body() dto: UpdateCommentDto,
  ) {
    return this.commentsService.update(userId, commentId, dto);
  }

  @Delete('comments/:commentId')
  remove(
    @CurrentUser('id') userId: string,
    @Param('commentId') commentId: string,
  ) {
    return this.commentsService.remove(userId, commentId);
  }
}
