import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateTaskGroupDto } from './dto/create-task-group.dto';
import { UpdateTaskGroupDto } from './dto/update-task-group.dto';
import { TaskGroup } from './entities/task-group.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Task } from 'src/tasks/entities/task.entity';

@Injectable()
export class TaskGroupsService {
  constructor(
    @InjectRepository(TaskGroup)
    private taskGroupRepository: Repository<TaskGroup>,
    @InjectRepository(Task)
    private readonly taskRepository: Repository<Task>
  ) {}

  async create(createTaskGroupDto: CreateTaskGroupDto): Promise<TaskGroup> {
    const { tasksId, ...taskGroupData } = createTaskGroupDto;

    const taskGroup = this.taskGroupRepository.create(taskGroupData);
    console.log(taskGroup);
    if (tasksId && tasksId.length > 0) {
      // Fetch tasks by IDs and assign them to the task group
      const tasks = await this.taskRepository.findByIds(tasksId);
      taskGroup.tasktemplate = tasks; // Associate tasks
    }

    return await this.taskGroupRepository.save(taskGroup);
  }

  findAll() {
    return this.taskGroupRepository.find({
      relations: ['tasktemplate']
    });
  }

  async findOne(id: number): Promise<TaskGroup> {
    const taskGroup = await this.taskGroupRepository.findOne(id, {
      relations: ['tasktemplate']
    });
    if (!taskGroup) {
      throw new NotFoundException(`TaskGroup with ID ${id} not found`);
    }
    return taskGroup;
  }

  async update(
    id: number,
    updateTaskGroupDto: UpdateTaskGroupDto
  ): Promise<TaskGroup> {
    const taskGroup = await this.taskGroupRepository.findOne(id);
    if (!taskGroup) {
      throw new NotFoundException(`TaskGroup with ID ${id} not found`);
    }

    const { tasksId, ...taskGroupData } = updateTaskGroupDto;

    // Update the task group with the new data
    Object.assign(taskGroup, taskGroupData);

    if (tasksId && tasksId.length > 0) {
      const tasks = await this.taskRepository.findByIds(tasksId);
      taskGroup.tasktemplate = tasks; // Update associated tasks
    } else {
      taskGroup.tasktemplate = []; // If no task IDs are provided, clear the existing tasks
    }

    return await this.taskGroupRepository.save(taskGroup);
  }

  async remove(id: number): Promise<void> {
    const taskGroup = await this.taskGroupRepository.findOne(id);
    if (!taskGroup) {
      throw new NotFoundException(`TaskGroup with ID ${id} not found`);
    }

    await this.taskGroupRepository.remove(taskGroup);
  }
}
