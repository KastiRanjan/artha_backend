import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { LessThanOrEqual, MoreThanOrEqual, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { UserEntity } from 'src/auth/entity/user.entity';
import { Project } from 'src/projects/entities/project.entity';
import { CreateWorklogDto, CreateWorklogListDto } from './dto/create-worklog.dto';
import { Worklog } from './entities/worklog.entity';
import { UpdateWorklogDto } from './dto/update-worklog.dto';
import { Task } from 'src/tasks/entities/task.entity';
import { NotificationService } from 'src/notification/notification.service';
import moment = require('moment');

@Injectable()
export class WorklogService {
  constructor(
    @InjectRepository(Worklog) private worklogRepository: Repository<Worklog>,
    @InjectRepository(UserEntity) private userRepository: Repository<UserEntity>,
    @InjectRepository(Project) private projectRepository: Repository<Project>,
    @InjectRepository(Task) private taskRepository: Repository<Task>,
    private readonly notificationService: NotificationService,

  ) { }

  async create(createWorklogDto: any, user: UserEntity) {
    const worklogs = [];

    for (const worklogDto of createWorklogDto) {
      const { projectId, taskId, startTime, endTime, approvedBy, ...worklogData } = worklogDto;

      // Fetch the associated entities
      const task = await this.taskRepository.findOne(taskId);
      const usr = await this.taskRepository.findOne({ id: approvedBy });
      const project = await this.projectRepository.findOne({ id: projectId }, { relations: ['projectLead'] });

      if (!task) {
        throw new NotFoundException(`Task with ID ${taskId} not found`);
      }
      if (!project) {
        throw new NotFoundException(`Project with ID ${projectId} not found`);
      }


      const startDate = moment.utc(startTime).toDate();  // Convert to UTC date object
      const endDate = moment.utc(endTime).toDate();      // Convert to UTC date object
      // Check for overlapping worklogs
      const overlappingWorklog = await this.worklogRepository.findOne({
        where: {
          user: user.id,
          startTime: LessThanOrEqual(endDate),  // Overlap if new startTime is before existing endTime
          endTime: MoreThanOrEqual(startDate),
        },
      });

      if (overlappingWorklog) {
        throw new BadRequestException('Overlapping worklog found');
      }

      // Create a new worklog instance
      const worklog = this.worklogRepository.create({
        ...worklogData,
        user,
        createdBy: user.id,
        task,
        startTime,
        endTime,
        approvedBy: usr,
        status:'requested'
      });
      worklogs.push(worklog);

      if (createWorklogDto.approvalRequest) {
        await this.notificationService.create({ message: `Worklog added for approval`, users: [project.projectLead.id] });
      }
    }

    // Save all worklogs to the database at once
    const savedWorklogs = await this.worklogRepository.save(worklogs);
    return savedWorklogs;
  }



  async findAll(user: UserEntity, status: 'open' | 'approved' | 'rejected' | 'pending' | 'requested') {
    return await this.worklogRepository.find({
      relations: ['user', 'task', 'task.project'],
      where: { user, status },
      order: {
        createdAt: 'DESC'
      }
    });
  }

  async findOne(id: string) {
    const worklog = await this.worklogRepository.findOne({
      relations: ['task', 'task.project.users','task.project'],
      where: { id }
    });
    if (!worklog) {
      throw new NotFoundException(`Worklog with ID ${id} not found`);
    }
    return worklog;
  }


  async findByTaskId(id: string) {
    const worklog = await this.worklogRepository.find({
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

  async remove(id: string) {
    return this.worklogRepository.delete(id);
  }
}
