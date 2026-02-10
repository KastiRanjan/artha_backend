import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TaskType } from './entities/task-type.entity';
import { CreateTaskTypeDto } from './dto/create-task-type.dto';
import { UpdateTaskTypeDto } from './dto/update-task-type.dto';

@Injectable()
export class TaskTypeService {
  constructor(
    @InjectRepository(TaskType)
    private taskTypeRepository: Repository<TaskType>,
  ) {}

  async create(createTaskTypeDto: CreateTaskTypeDto): Promise<TaskType> {
    const taskType = this.taskTypeRepository.create(createTaskTypeDto);
    return this.taskTypeRepository.save(taskType);
  }

  async findAll(activeOnly: boolean = false): Promise<TaskType[]> {
    const query = this.taskTypeRepository.createQueryBuilder('taskType')
      .leftJoinAndSelect('taskType.todoTaskTitle', 'todoTaskTitle');
    
    if (activeOnly) {
      query.where('taskType.isActive = :isActive', { isActive: true });
    }
    
    return query.orderBy('taskType.createdAt', 'DESC').getMany();
  }

  async findOne(id: string): Promise<TaskType> {
    const taskType = await this.taskTypeRepository.findOne({
      where: { id },
      relations: ['todoTaskTitle'],
    });
    
    if (!taskType) {
      throw new NotFoundException(`Task type with ID "${id}" not found`);
    }
    
    return taskType;
  }

  async update(id: string, updateTaskTypeDto: UpdateTaskTypeDto): Promise<TaskType> {
    await this.findOne(id); // Validate existence
    await this.taskTypeRepository.update(id, updateTaskTypeDto);
    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    const result = await this.taskTypeRepository.delete(id);
    
    if (result.affected === 0) {
      throw new NotFoundException(`Task type with ID "${id}" not found`);
    }
  }
}