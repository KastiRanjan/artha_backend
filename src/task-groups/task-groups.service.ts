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
    const { ...taskGroupData } = createTaskGroupDto;

    const taskGroup = this.taskGroupRepository.create(taskGroupData);

    return await this.taskGroupRepository.save(taskGroup);
  }

  findAll() {
    console.log('ok');
    return this.taskGroupRepository.find();
  }

  async findOne(id: string): Promise<TaskGroup> {
    console.log('kkk');
    const taskGroup = await this.taskGroupRepository.findOne({
      where: {
        id
      },
      relations: ['tasktemplate']
    });
    // console.log('taskGroup', taskGroup);
    // if (taskGroup && taskGroup.tasktemplate) {
    //   taskGroup.tasktemplate = taskGroup.tasktemplate.filter(
    //     (template) => template.parentTask === null
    //   );
    // }
    if (!taskGroup) {
      throw new NotFoundException(`TaskGroup with ID ${id} not found`);
    }
    return taskGroup;
  }

  async update(
    id: string,
    updateTaskGroupDto: UpdateTaskGroupDto
  ): Promise<TaskGroup> {
    const taskGroup = await this.taskGroupRepository.preload({
      id,
      ...updateTaskGroupDto
    });
    if (!taskGroup) {
      throw new NotFoundException(`TaskGroup with ID ${id} not found`);
    }

    return await this.taskGroupRepository.save(taskGroup);
  }

  async remove(id: string): Promise<void> {
    const taskGroup = await this.taskGroupRepository.findOne(id);
    if (!taskGroup) {
      throw new NotFoundException(`TaskGroup with ID ${id} not found`);
    }

    await this.taskGroupRepository.remove(taskGroup);
  }
}
