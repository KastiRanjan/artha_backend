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
    const { name, description, groupId, parentTaskId, taskType, budgetedHours, rank } =
      createTaskTemplateDto;

    // ...existing code...

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
      parentTask,
      budgetedHours: budgetedHours || 0,
      rank: rank || 0
    });

    try {
      // Save the task to the database
      const savedTask = await this.taskTemplateRepository.save(task);

      // Return the saved task with relations
      return await this.taskTemplateRepository.findOne({
        where: { id: savedTask.id },
        relations: ['group', 'parentTask', 'subTasks']
      });
    } catch (error) {
      // Handle database constraint violations and validation errors
      if (error.code === '23505' || error.code === 'ER_DUP_ENTRY') {
        throw new BadRequestException(`A task template with the name "${name}" already exists`);
      }
      
      // Handle database length constraint violations
      if (error.code === '22001' || (error.message && error.message.includes('Data too long'))) {
        throw new BadRequestException('Task template name cannot exceed 100 characters');
      }
      
      throw error;
    }
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
    const { name, description, groupId, taskType, parentTaskId, budgetedHours, rank } =
      updateTaskTemplateDto;

    // Validate name length if name is being updated
    if (name && name.length > 100) {
      throw new BadRequestException('Task template name cannot exceed 100 characters');
    }

    // Find the existing task
    const existingTask = await this.taskTemplateRepository.findOne({
      where: { id },
      relations: ['parentTask', 'subTasks', 'group']
    });

    if (!existingTask) {
      throw new BadRequestException(`Task template with ID ${id} not found`);
    }

    // Check for duplicate name if name is being changed
    if (name && name !== existingTask.name) {
      const duplicateTask = await this.taskTemplateRepository.findOne({
        where: { name }
      });

      if (duplicateTask) {
        throw new BadRequestException(`A task template with the name "${name}" already exists`);
      }
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
      // Find the TaskGroup by ID
      group = await this.taskgroupRepository.findOne({
        where: { id: groupId }
      });
      if (!group) {
        throw new BadRequestException(`Task group with ID ${groupId} not found`);
      }
    }

    try {
      // Update the task
      await this.taskTemplateRepository.update(id, {
        name: name || existingTask.name,
        description: description !== undefined ? description : existingTask.description,
        taskType: taskType || existingTask.taskType,
        group: group, // Use the group variable we defined above
        parentTask,
        budgetedHours: budgetedHours !== undefined ? budgetedHours : existingTask.budgetedHours,
        rank: rank !== undefined ? rank : existingTask.rank
      });

      // Return the updated task with relations
      return await this.taskTemplateRepository.findOne({
        where: { id },
        relations: ['group', 'parentTask', 'subTasks']
      });
    } catch (error) {
      // Handle database constraint violations and validation errors
      if (error.code === '23505' || error.code === 'ER_DUP_ENTRY') {
        throw new BadRequestException(`A task template with the name "${name}" already exists`);
      }
      
      // Handle database length constraint violations
      if (error.code === '22001' || (error.message && error.message.includes('Data too long'))) {
        throw new BadRequestException('Task template name cannot exceed 100 characters');
      }
      
      throw error;
    }
  }

  remove(id: string) {
    return this.taskTemplateRepository.delete(id);
  }
}
