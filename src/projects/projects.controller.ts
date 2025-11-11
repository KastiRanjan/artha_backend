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
import { AssignUserToProjectDto } from './dto/assign-user-to-project.dto';
import { ReleaseUserFromProjectDto } from './dto/release-user-from-project.dto';
import { UpdateUserAssignmentDto } from './dto/update-user-assignment.dto';
import { UserAvailabilityService } from './user-availability.service';

@ApiTags('projects')
@UseGuards(JwtTwoFactorGuard, PermissionGuard)
@Controller('projects')
@ApiBearerAuth()
export class ProjectsController {
  constructor(
    private readonly projectsService: ProjectsService,
    private readonly projectTimelineService: ProjectTimelineService,
    private readonly userAvailabilityService: UserAvailabilityService
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

  // User Assignment Endpoints
  @Post(':id/users/assign')
  @ApiOperation({ summary: 'Assign a user to a project with assignment details' })
  assignUserToProject(
    @Param('id') projectId: string,
    @Body() assignDto: AssignUserToProjectDto,
    @GetUser() user: UserEntity
  ) {
    return this.projectsService.assignUserToProject(projectId, assignDto, user);
  }

  @Patch(':id/users/:userId/release')
  @ApiOperation({ summary: 'Release a user from a project' })
  releaseUserFromProject(
    @Param('id') projectId: string,
    @Param('userId') userId: string,
    @Body() releaseDto: ReleaseUserFromProjectDto,
    @GetUser() user: UserEntity
  ) {
    return this.projectsService.releaseUserFromProject(projectId, userId, releaseDto, user);
  }

  @Patch(':id/users/:userId')
  @ApiOperation({ summary: 'Update user assignment details' })
  updateUserAssignment(
    @Param('id') projectId: string,
    @Param('userId') userId: string,
    @Body() updateDto: UpdateUserAssignmentDto,
    @GetUser() user: UserEntity
  ) {
    return this.projectsService.updateUserAssignment(projectId, userId, updateDto, user);
  }

  @Get(':id/users/assignments')
  @ApiOperation({ summary: 'Get all user assignments for a project' })
  getProjectUserAssignments(@Param('id') projectId: string) {
    return this.projectsService.getProjectUserAssignments(projectId);
  }

  @Get('users/:userId/assignments')
  @ApiOperation({ summary: 'Get all project assignments for a user' })
  getUserProjectAssignments(@Param('userId') userId: string) {
    return this.projectsService.getUserProjectAssignments(userId);
  }

  // User Availability Endpoints
  @Get('availability/users')
  @ApiOperation({ summary: 'Get availability status for all users' })
  getUserAvailability(@Query('date') date?: string) {
    const checkDate = date ? new Date(date) : undefined;
    return this.userAvailabilityService.getUserAvailability(checkDate);
  }

  @Get('availability/timeline')
  @ApiOperation({ summary: 'Get user availability timeline for a date range' })
  getUserAvailabilityTimeline(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string
  ) {
    return this.userAvailabilityService.getUserAvailabilityTimeline(
      new Date(startDate),
      new Date(endDate)
    );
  }

  @Get('availability/users/:userId')
  @ApiOperation({ summary: 'Get availability for a specific user' })
  getUserAvailabilityById(@Param('userId') userId: string) {
    return this.userAvailabilityService.getUserAvailabilityById(userId);
  }

  @Get('availability/available')
  @ApiOperation({ summary: 'Get all available users at a specific date' })
  getAvailableUsers(@Query('date') date?: string) {
    const checkDate = date ? new Date(date) : undefined;
    return this.userAvailabilityService.getAvailableUsers(checkDate);
  }

  @Get('availability/available-by')
  @ApiOperation({ summary: 'Get users who will be available by a specific date' })
  getUsersAvailableBy(@Query('date') date: string) {
    return this.userAvailabilityService.getUsersAvailableBy(new Date(date));
  }
}
