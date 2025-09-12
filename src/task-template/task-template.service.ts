import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateTaskTemplateDto } from './dto/create-task-template.dto';
import { UpdateTaskTemplateDto } from './dto/update-task-template.dto';
import { Repository } from 'typeorm';
import { TaskTemplate } from './entities/task-template.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { TaskGroup } from 'src/task-groups/entities/task-group.entity';

@Injectable()
export class TaskTemplateService {
  constructor(
    @InjectRepository(TaskTemplate)
    private readonly taskTemplateRepository: Repository<TaskTemplate>,
    @InjectRepository(TaskGroup)
    private readonly taskgroupRepository: Repository<TaskGroup>
  ) {}
  async create(createTaskTemplateDto: CreateTaskTemplateDto) {
    const { name, description, groupId, parentTaskId, taskType } =
      createTaskTemplateDto;

    // Validate parent task if parentTaskId is provided
    let parentTask = null;
    if (parentTaskId) {
      parentTask = await this.taskTemplateRepository.findOne({ 
        where: { id: parentTaskId },
        relations: ['subTasks'] 
      });
      
      if (!parentTask) {
        throw new BadRequestException(`Parent task with ID ${parentTaskId} not found`);
      }
      
      // Validate that parent is a story if creating a task
      if (taskType === 'task' && parentTask.taskType !== 'story') {
        throw new BadRequestException('Tasks can only be created under stories');
      }
    }

    // Validate task type logic
    if (taskType === 'task' && !parentTaskId) {
      throw new BadRequestException('Tasks must have a parent story');
    }

    // Get task group
    const group = groupId ? await this.taskgroupRepository.findOne({ 
      where: { id: groupId } 
    }) : null;

    if (groupId && !group) {
      throw new BadRequestException(`Task group with ID ${groupId} not found`);
    }

    // Create a new task instance
    const task = this.taskTemplateRepository.create({
      name,
      description,
      taskType,
      group,
      parentTask
    });

    // Save the task to the database
    const savedTask = await this.taskTemplateRepository.save(task);

    // Return the saved task with relations
    return await this.taskTemplateRepository.findOne({
      where: { id: savedTask.id },
      relations: ['group', 'parentTask', 'subTasks']
    });
  }

  async findAll() {
    const tasks = await this.taskTemplateRepository.find({
      relations: ['group', 'parentTask', 'subTasks'],
      order: {
        createdAt: 'ASC'
      }
    });

    // Ensure the subTasks are properly loaded for each parent task
    for (const task of tasks) {
      if (task.taskType === 'story' && task.subTasks) {
        // Reload subtasks with full relations to ensure they're complete
        task.subTasks = await this.taskTemplateRepository.find({
          where: { parentTask: { id: task.id } },
          relations: ['parentTask'],
          order: { createdAt: 'ASC' }
        });
      }
    }

    return tasks;
  }

  async findOne(id: string) {
    return await this.taskTemplateRepository.findOne({
      where: { id },
      relations: ['group', 'parentTask', 'subTasks']
    });
  }

  async update(id: string, updateTaskTemplateDto: UpdateTaskTemplateDto) {
    const { name, description, groupId, taskType, parentTaskId } =
      updateTaskTemplateDto;

    // Find the existing task
    const existingTask = await this.taskTemplateRepository.findOne({
      where: { id },
      relations: ['parentTask', 'subTasks', 'group']
    });

    if (!existingTask) {
      throw new BadRequestException(`Task template with ID ${id} not found`);
    }

    // Validate parent task if parentTaskId is provided
    let parentTask = null;
    if (parentTaskId) {
      parentTask = await this.taskTemplateRepository.findOne({
        where: { id: parentTaskId },
        relations: ['subTasks']
      });

      if (!parentTask) {
        throw new BadRequestException(`Parent task with ID ${parentTaskId} not found`);
      }

      // Validate that parent is a story if updating to task type
      if (taskType === 'task' && parentTask.taskType !== 'story') {
        throw new BadRequestException('Tasks can only be created under stories');
      }
    }

    // Validate task type logic
    if (taskType === 'task' && !parentTaskId) {
      throw new BadRequestException('Tasks must have a parent story');
    }

    // Get task group if provided
    let group = existingTask.group;
    if (groupId) {
      group = await this.taskgroupRepository.findOne({
        where: { id: groupId }
      });
      if (!group) {
        throw new BadRequestException(`Task group with ID ${groupId} not found`);
      }
    }

    // Update the task
    await this.taskTemplateRepository.update(id, {
      name: name || existingTask.name,
      description: description !== undefined ? description : existingTask.description,
      taskType: taskType || existingTask.taskType,
      group,
      parentTask
    });

    // Return the updated task with relations
    return await this.taskTemplateRepository.findOne({
      where: { id },
      relations: ['group', 'parentTask', 'subTasks']
    });
  }

  remove(id: string) {
    return this.taskTemplateRepository.delete(id);
  }
}
