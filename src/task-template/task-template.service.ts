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

    // Create a new task instance
    const task = this.taskTemplateRepository.create({
      name,
      description,
      taskType,
      group: groupId ? await this.taskgroupRepository.findOne(groupId) : null, // Assign task group
      parentTask: parentTaskId
        ? await this.taskTemplateRepository.findOne({ id: parentTaskId })
        : null
    });

    // Save the task to the database
    return await this.taskTemplateRepository.save(task);
  }

  findAll() {
    return this.taskTemplateRepository.find({
      relations: ['group', 'parentTask', 'subTasks']
    });
  }

  findOne(id: string) {
    return this.taskTemplateRepository.findOne(id);
  }

  async update(id: string, updateTaskTemplateDto: UpdateTaskTemplateDto) {
    const { name, description, groupId, taskType, parentTaskId } =
      updateTaskTemplateDto;

    // Create a new task instance
    const task = this.taskTemplateRepository.create({
      name,
      description,
      group: groupId ? await this.taskgroupRepository.findOne(groupId) : null, // Assign task group
      taskType: taskType,
      parentTask: parentTaskId
        ? await this.taskTemplateRepository.findOne({ id: parentTaskId })
        : null
    });
    return this.taskTemplateRepository.update(id, task);
  }

  remove(id: string) {
    return this.taskTemplateRepository.delete(id);
  }
}
