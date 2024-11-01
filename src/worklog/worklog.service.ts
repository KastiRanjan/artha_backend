import { Injectable, NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { UserEntity } from 'src/auth/entity/user.entity';
import { Project } from 'src/projects/entities/project.entity';
import { CreateWorklogDto } from './dto/create-worklog.dto';
import { Worklog } from './entities/worklog.entity';
import { UpdateWorklogDto } from './dto/update-worklog.dto';
import { Task } from 'src/tasks/entities/task.entity';

@Injectable()
export class WorklogService {
  constructor(
    @InjectRepository(Worklog) private worklogRepository: Repository<Worklog>,
    @InjectRepository(UserEntity) private userRepository: Repository<UserEntity>,
    @InjectRepository(Project) private projectRepository: Repository<Project>,
    @InjectRepository(Task) private taskRepository: Repository<Task>
  ) {}

  async create(createWorklogDto: CreateWorklogDto) {
    const { userId, taskId, ...worklogData } = createWorklogDto;
  
    // Fetch the associated entities
    const user = await this.userRepository.findOne(userId);
    const task = await this.taskRepository.findOne(taskId);
  
    // Validate that all required entities exist
    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }
    if (!task) {
      throw new NotFoundException(`Task with ID ${taskId} not found`);
    }
  
    // Create a new worklog instance
    const worklog = this.worklogRepository.create({
      ...worklogData,
      user,
      createdBy: user.id,
      task
    });
  
    // Save the new worklog to the database
    return await this.worklogRepository.save(worklog);
  }
    

  findAll() {
    return this.worklogRepository.find();
  }

  async findOne(id: string) {
    const worklog = await this.worklogRepository.findOne({
      where: { id }
    });
    if (!worklog) {
      throw new NotFoundException(`Worklog with ID ${id} not found`);
    }
    return worklog;
  }

  
  async findByTaskId(id: string) {
    const worklog = await this.worklogRepository.find({
      where: { task: { id } },
      relations: ['user'],
      order: {
        createdAt: 'DESC'
      },
    });
    if (!worklog) {
      throw new NotFoundException(`Worklog with task ID ${id} not found`);
    }
    return worklog;
  }

  async update(id: string, updateWorklogDto: UpdateWorklogDto) {
    const worklog = await this.findOne(id);
    if (!worklog) {
      throw new NotFoundException(`Worklog with ID ${id} not found`);
    }
    Object.assign(worklog, updateWorklogDto);
    return this.worklogRepository.save(worklog);
  }

  remove(id: string) {
    return this.worklogRepository.delete(id);}
}
