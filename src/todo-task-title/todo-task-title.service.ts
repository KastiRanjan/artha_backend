import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TodoTaskTitle } from './entities/todo-task-title.entity';
import { CreateTodoTaskTitleDto } from './dto/create-todo-task-title.dto';
import { UpdateTodoTaskTitleDto } from './dto/update-todo-task-title.dto';

@Injectable()
export class TodoTaskTitleService {
  constructor(
    @InjectRepository(TodoTaskTitle)
    private todoTaskTitleRepository: Repository<TodoTaskTitle>,
  ) {}

  async create(createDto: CreateTodoTaskTitleDto): Promise<TodoTaskTitle> {
    const title = this.todoTaskTitleRepository.create(createDto);
    return this.todoTaskTitleRepository.save(title);
  }

  async findAll(activeOnly: boolean = false): Promise<TodoTaskTitle[]> {
    const query = this.todoTaskTitleRepository.createQueryBuilder('title')
      .leftJoinAndSelect('title.taskTypes', 'taskTypes');

    if (activeOnly) {
      query.where('title.isActive = :isActive', { isActive: true });
    }

    return query.orderBy('title.createdAt', 'DESC').getMany();
  }

  async findOne(id: string): Promise<TodoTaskTitle> {
    const title = await this.todoTaskTitleRepository.findOne({
      where: { id },
      relations: ['taskTypes'],
    });

    if (!title) {
      throw new NotFoundException(`Todo task title with ID "${id}" not found`);
    }

    return title;
  }

  async update(id: string, updateDto: UpdateTodoTaskTitleDto): Promise<TodoTaskTitle> {
    await this.findOne(id);
    await this.todoTaskTitleRepository.update(id, updateDto);
    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    const result = await this.todoTaskTitleRepository.delete(id);

    if (result.affected === 0) {
      throw new NotFoundException(`Todo task title with ID "${id}" not found`);
    }
  }
}
