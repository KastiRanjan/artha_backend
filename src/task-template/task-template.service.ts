import { Injectable } from '@nestjs/common';
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
    const { name, description, groupId } = createTaskTemplateDto;
    console.log(await this.taskgroupRepository.findOne(groupId));

    // Create a new task instance
    const task = this.taskTemplateRepository.create({
      name,
      description,
      group: groupId ? await this.taskgroupRepository.findOne(groupId) : null // Assign task group
    });

    // Save the task to the database
    return await this.taskTemplateRepository.save(task);
  }

  findAll() {
    return this.taskTemplateRepository.find({ relations: ['group'] });
  }

  findOne(id: number) {
    return this.taskTemplateRepository.findOne(id);
  }

  async update(id: number, updateTaskTemplateDto: UpdateTaskTemplateDto) {
    const { name, description, groupId } = updateTaskTemplateDto;

    // Create a new task instance
    const task = this.taskTemplateRepository.create({
      name,
      description,
      group: groupId ? await this.taskgroupRepository.findOne(groupId) : null // Assign task group
    });
    return this.taskTemplateRepository.update(id, task);
  }

  remove(id: number) {
    return this.taskTemplateRepository.delete(id);
  }
}
