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
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { ProjectsService } from './projects.service';

@Controller('projects')
@UseGuards(JwtAuthGuard)
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Post()
  create(
    @CurrentUser('id') userId: string,
    @Body() dto: CreateProjectDto,
  ) {
    return this.projectsService.create(userId, dto);
  }

  @Get()
  findMyProjects(@CurrentUser('id') userId: string) {
    return this.projectsService.findMyProjects(userId);
  }

  @Get(':projectId')
  findOne(
    @CurrentUser('id') userId: string,
    @Param('projectId') projectId: string,
  ) {
    return this.projectsService.findOne(userId, projectId);
  }

  @Patch(':projectId')
  update(
    @CurrentUser('id') userId: string,
    @Param('projectId') projectId: string,
    @Body() dto: UpdateProjectDto,
  ) {
    return this.projectsService.update(userId, projectId, dto);
  }

  @Delete(':projectId')
  archive(
    @CurrentUser('id') userId: string,
    @Param('projectId') projectId: string,
  ) {
    return this.projectsService.archive(userId, projectId);
  }
}