import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query
} from '@nestjs/common';
import { ProjectsService } from './projects.service';
import { ProjectTimelineService } from './project-timeline.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { AddFromTemplatesDto } from './dto/add-from-templates.dto';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import JwtTwoFactorGuard from 'src/common/guard/jwt-two-factor.guard';
import { PermissionGuard } from 'src/common/guard/permission.guard';
import { GetUser } from 'src/common/decorators/get-user.decorator';
import { UserEntity } from 'src/auth/entity/user.entity';

@ApiTags('projects')
@UseGuards(JwtTwoFactorGuard, PermissionGuard)
@Controller('projects')
@ApiBearerAuth()
export class ProjectsController {
  constructor(
    private readonly projectsService: ProjectsService,
    private readonly projectTimelineService: ProjectTimelineService
  ) {}

  @Get(':id/timeline')
  async getTimeline(@Param('id') id: string) {
    return this.projectTimelineService.getTimeline(id);
  }

  @Post()
  create(@Body() createProjectDto: CreateProjectDto) {
    return this.projectsService.create(createProjectDto);
  }

  @Get()
  findAll(
    @GetUser() user: UserEntity,
    @Query('status') status: 'active' | 'suspended' | 'archived' | 'signed_off'
  ) {
    return this.projectsService.findAll(status, user);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.projectsService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateProjectDto: UpdateProjectDto) {
    return this.projectsService.update(id, updateProjectDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.projectsService.remove(id);
  }

  @Get('users/:uid')
  userProjects(@Param('uid') uid: string) {
    return this.projectsService.findByUserId(uid);
  }

  @Post('add-from-templates')
  @ApiOperation({ summary: 'Add tasks to project from templates' })
  addFromTemplates(@Body() addFromTemplatesDto: AddFromTemplatesDto) {
    return this.projectsService.addFromTemplates(addFromTemplatesDto);
  }

  @Post(':id/complete')
  @ApiOperation({ summary: 'Mark project as completed (project lead or manager only)' })
  completeProject(@Param('id') id: string, @GetUser() user: UserEntity) {
    return this.projectsService.completeProject(id, user);
  }
}
