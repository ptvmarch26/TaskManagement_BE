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
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { ProjectsService } from './projects.service';

@ApiTags('Projects')
@ApiBearerAuth()
@Controller('projects')
@UseGuards(JwtAuthGuard)
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @ApiOperation({ summary: 'Create a new project' })
  @ApiResponse({ status: 201, description: 'Project created successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @Post()
  create(
    @CurrentUser('id') userId: string,
    @Body() dto: CreateProjectDto,
  ) {
    return this.projectsService.create(userId, dto);
  }

  @ApiOperation({ summary: 'Get projects that current user belongs to' })
  @ApiResponse({ status: 200, description: 'Project list returned successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @Get()
  findMyProjects(@CurrentUser('id') userId: string) {
    return this.projectsService.findMyProjects(userId);
  }

  @ApiOperation({ summary: 'Get project detail' })
  @ApiParam({
    name: 'projectId',
    example: 'clxproject123',
  })
  @ApiResponse({ status: 200, description: 'Project detail returned successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Project not found' })
  @Get(':projectId')
  findOne(
    @CurrentUser('id') userId: string,
    @Param('projectId') projectId: string,
  ) {
    return this.projectsService.findOne(userId, projectId);
  }

  @ApiOperation({ summary: 'Update project information' })
  @ApiParam({
    name: 'projectId',
    example: 'clxproject123',
  })
  @ApiResponse({ status: 200, description: 'Project updated successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Only project owner can update project' })
  @ApiResponse({ status: 404, description: 'Project not found' })
  @Patch(':projectId')
  update(
    @CurrentUser('id') userId: string,
    @Param('projectId') projectId: string,
    @Body() dto: UpdateProjectDto,
  ) {
    return this.projectsService.update(userId, projectId, dto);
  }

  @ApiOperation({ summary: 'Archive a project' })
  @ApiParam({
    name: 'projectId',
    example: 'clxproject123',
  })
  @ApiResponse({ status: 200, description: 'Project archived successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Only project owner can archive project' })
  @ApiResponse({ status: 404, description: 'Project not found' })
  @Delete(':projectId')
  archive(
    @CurrentUser('id') userId: string,
    @Param('projectId') projectId: string,
  ) {
    return this.projectsService.archive(userId, projectId);
  }
}