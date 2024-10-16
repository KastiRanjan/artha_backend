import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { Task } from './entities/task.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { UserEntity } from 'src/auth/entity/user.entity';
import { Project } from 'src/projects/entities/project.entity';

@Injectable()
export class TasksService {
  constructor(
    @InjectRepository(Task) private taskRepository: Repository<Task>,
    @InjectRepository(UserEntity)
    private userRepository: Repository<UserEntity>,
    @InjectRepository(Project) private projectRepository: Repository<Project>
  ) {}

  async create(createTaskDto: CreateTaskDto) {
    const { name, description, groupId, projectId, parentTaskId } =
      createTaskDto;
    
  }

  findAll() {
    return this.taskRepository.find({
      relations: ['reporter', 'assignees', 'project', 'parentTask']
    });
  }

  async findOne(id: number) {
    const task = await this.taskRepository.findOne({
      where: { id },
      relations: ['reporter', 'assignees', 'project', 'parentTask']
    });
    if (!task) {
      throw new NotFoundException(`Task with ID ${id} not found`);
    }
    return task;
  }

  async update(id: number, updateTaskDto: UpdateTaskDto) {
    const task = await this.findOne(id); // Ensures task exists

    // Update other properties if provided
    task.name = updateTaskDto.name ?? task.name;
    task.description = updateTaskDto.description ?? task.description;
    task.parentTask = updateTaskDto.parentTaskId
      ? await this.taskRepository.findOne({
          where: { id: updateTaskDto.parentTaskId }
        })
      : task.parentTask;

    return this.taskRepository.save(task);
  }

  remove(id: number) {
    return `This action removes a #${id} task`;
  }
}
