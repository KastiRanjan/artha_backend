import {
  Controller,
  Get,
  Param,
  UseGuards,
  NotFoundException,
  BadRequestException
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TaskGroupProject } from './entities/task-group-project.entity';
import { TaskSuperProject } from 'src/task-super/entities/task-super-project.entity';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { PermissionGuard } from 'src/common/guard/permission.guard';
import JwtTwoFactorGuard from 'src/common/guard/jwt-two-factor.guard';

@ApiTags('task-group-project')
@UseGuards(JwtTwoFactorGuard, PermissionGuard)
@Controller('task-group-project')
@ApiBearerAuth()
export class TaskGroupProjectController {
  constructor(
    @InjectRepository(TaskGroupProject)
    private taskGroupProjectRepository: Repository<TaskGroupProject>,
    @InjectRepository(TaskSuperProject)
    private taskSuperProjectRepository: Repository<TaskSuperProject>
  ) {}

  /**
   * Get all project-scoped task groups for a specific project
   * These are the project instances of task groups that should be used when creating/updating tasks
   */
  @Get('project/:projectId')
  async findByProjectId(@Param('projectId') projectId: string) {
    if (!projectId) {
      throw new BadRequestException('projectId is required');
    }

    const taskGroupProjects = await this.taskGroupProjectRepository.find({
      where: { projectId },
      relations: ['taskSuper']
    });

    if (!taskGroupProjects || taskGroupProjects.length === 0) {
      return []; // Return empty array if no project-scoped groups found
    }

    return taskGroupProjects;
  }

  /**
   * Get task groups for a specific task super project
   */
  @Get('task-super-project/:taskSuperProjectId')
  async findByTaskSuperProjectId(@Param('taskSuperProjectId') taskSuperProjectId: string) {
    if (!taskSuperProjectId) {
      throw new BadRequestException('taskSuperProjectId is required');
    }

    // Verify task super project exists
    const taskSuperProject = await this.taskSuperProjectRepository.findOne({
      where: { id: taskSuperProjectId }
    });

    if (!taskSuperProject) {
      throw new NotFoundException(`TaskSuperProject with ID ${taskSuperProjectId} not found`);
    }

    const taskGroupProjects = await this.taskGroupProjectRepository.find({
      where: { taskSuperProject: { id: taskSuperProjectId } },
      relations: ['taskSuper']
    });

    return taskGroupProjects;
  }

  /**
   * Get a specific project-scoped task group by ID
   */
  @Get(':id')
  async findById(@Param('id') id: string) {
    if (!id) {
      throw new BadRequestException('id is required');
    }

    const taskGroupProject = await this.taskGroupProjectRepository.findOne({
      where: { id },
      relations: ['taskSuper']
    });

    if (!taskGroupProject) {
      throw new NotFoundException(`TaskGroupProject with ID ${id} not found`);
    }

    return taskGroupProject;
  }
}
