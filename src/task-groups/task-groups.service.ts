import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateTaskGroupDto } from './dto/create-task-group.dto';
import { UpdateTaskGroupDto } from './dto/update-task-group.dto';
import { TaskGroup } from './entities/task-group.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Task } from 'src/tasks/entities/task.entity';
import { TaskTemplate } from 'src/task-template/entities/task-template.entity';
import { TaskSuper } from 'src/task-super/entities/task-super.entity';

@Injectable()
export class TaskGroupsService {
  constructor(
    @InjectRepository(TaskGroup)
    private taskGroupRepository: Repository<TaskGroup>,
    @InjectRepository(Task)
    private readonly taskRepository: Repository<Task>,
    @InjectRepository(TaskTemplate)
    private readonly taskTemplateRepository: Repository<TaskTemplate>,
    @InjectRepository(TaskSuper)
    private readonly taskSuperRepository: Repository<TaskSuper>
  ) {}

  async create(createTaskGroupDto: CreateTaskGroupDto): Promise<TaskGroup> {
    const { taskSuperId, ...taskGroupData } = createTaskGroupDto;

    const taskGroup = this.taskGroupRepository.create({
      ...taskGroupData,
      taskSuperId // Add this line to explicitly set taskSuperId
    });
    
    // Set TaskSuper if provided
    if (taskSuperId) {
      const taskSuper = await this.taskSuperRepository.findOne({
        where: { id: taskSuperId }
      });
      if (!taskSuper) {
        throw new NotFoundException(`TaskSuper with ID ${taskSuperId} not found`);
      }
      taskGroup.taskSuper = taskSuper;
      taskGroup.taskSuperId = taskSuperId; // Also explicitly set taskSuperId here
    }

    return await this.taskGroupRepository.save(taskGroup);
  }

  async findAll(taskSuperId?: string) {
    let taskGroups;
    
    if (taskSuperId) {
      // Filter by taskSuperId when provided
      taskGroups = await this.taskGroupRepository.find({
        where: { taskSuperId },
        relations: ['taskSuper', 'tasktemplate', 'tasktemplate.parentTask', 'tasktemplate.subTasks'],
        order: {
          rank: 'ASC',
          updatedAt: 'DESC'
        }
      });
    } else {
      // Return all when no filter is provided
      taskGroups = await this.taskGroupRepository.find({
        relations: ['taskSuper', 'tasktemplate', 'tasktemplate.parentTask', 'tasktemplate.subTasks'],
        order: {
          rank: 'ASC',
          updatedAt: 'DESC'
        }
      });
    }
    
    // Process each task group to organize templates
    for (const taskGroup of taskGroups) {
      // Organize the task templates properly with parent-child relationships
      if (taskGroup && taskGroup.tasktemplate) {
        // Manually populate subtasks for each story to ensure complete data
        for (const template of taskGroup.tasktemplate) {
          if (template.taskType === 'story') {
            // Get all tasks that have this story as parent
            const subtasks = await this.taskTemplateRepository.find({
              where: { 
                parentTask: { id: template.id }
              },
              relations: ['parentTask']
            });
            template.subTasks = subtasks;
          }
        }
      }
    }
    
    return taskGroups;
  }

  async findOne(id: string): Promise<TaskGroup> {
    const taskGroup = await this.taskGroupRepository.findOne({
      where: {
        id
      },
      relations: [
        'taskSuper',
        'tasktemplate', 
        'tasktemplate.parentTask', 
        'tasktemplate.subTasks'
      ]
    });
    
    if (!taskGroup) {
      throw new NotFoundException(`TaskGroup with ID ${id} not found`);
    }
    
    // Organize the task templates properly with parent-child relationships
    if (taskGroup && taskGroup.tasktemplate) {
      // Manually populate subtasks for each story to ensure complete data
      for (const template of taskGroup.tasktemplate) {
        if (template.taskType === 'story') {
          // Get all tasks that have this story as parent
          const subtasks = await this.taskTemplateRepository.find({
            where: { 
              parentTask: { id: template.id }
            },
            relations: ['parentTask']
          });
          template.subTasks = subtasks;
        }
      }
    }
    
    return taskGroup;
  }

  async update(
    id: string,
    updateTaskGroupDto: UpdateTaskGroupDto
  ): Promise<TaskGroup> {
    const { taskSuperId, ...taskGroupData } = updateTaskGroupDto;
    
    const taskGroup = await this.taskGroupRepository.preload({
      id,
      ...taskGroupData,
      taskSuperId // Add this line to explicitly set taskSuperId
    });
    
    if (!taskGroup) {
      throw new NotFoundException(`TaskGroup with ID ${id} not found`);
    }
    
    // Update TaskSuper if provided
    if (taskSuperId) {
      const taskSuper = await this.taskSuperRepository.findOne({
        where: { id: taskSuperId }
      });
      if (!taskSuper) {
        throw new NotFoundException(`TaskSuper with ID ${taskSuperId} not found`);
      }
      taskGroup.taskSuper = taskSuper;
      taskGroup.taskSuperId = taskSuperId; // Also explicitly set taskSuperId here
    }

    return await this.taskGroupRepository.save(taskGroup);
  }

  async remove(id: string): Promise<void> {
    const taskGroup = await this.taskGroupRepository.findOne({
      where: { id }
    });
    if (!taskGroup) {
      throw new NotFoundException(`TaskGroup with ID ${id} not found`);
    }

    await this.taskGroupRepository.remove(taskGroup);
  }
}
