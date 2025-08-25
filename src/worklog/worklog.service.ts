import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { LessThanOrEqual, MoreThanOrEqual, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { UserEntity } from 'src/auth/entity/user.entity';
import { Project } from 'src/projects/entities/project.entity';
import { ProjectTimelineService } from 'src/projects/project-timeline.service';
import { CreateWorklogDto, CreateWorklogListDto } from './dto/create-worklog.dto';
import { Worklog } from './entities/worklog.entity';
import { UpdateWorklogDto } from './dto/update-worklog.dto';
import { Task } from 'src/tasks/entities/task.entity';
import { NotificationService } from 'src/notification/notification.service';

import { LeaveService } from 'src/leave/leave.service';
import { HolidayService } from 'src/holiday/holiday.service';
import moment = require('moment');

@Injectable()
export class WorklogService {
  constructor(
    @InjectRepository(Worklog) private worklogRepository: Repository<Worklog>,
    @InjectRepository(UserEntity) private userRepository: Repository<UserEntity>,
    @InjectRepository(Project) private projectRepository: Repository<Project>,
    @InjectRepository(Task) private taskRepository: Repository<Task>,
    private readonly notificationService: NotificationService,
  private readonly projectTimelineService: ProjectTimelineService,
  private readonly leaveService: LeaveService,
  private readonly holidayService: HolidayService
  ) { }

  async create(createWorklogDto: any, user: UserEntity) {

    const worklogs = [];
    for (const worklogDto of createWorklogDto) {
      const { projectId, taskId, startTime, endTime, ...worklogData } = worklogDto;

      // Fetch the associated entities
      const task = await this.taskRepository.findOne(taskId);
      const project = await this.projectRepository.findOne({ id: projectId }, { relations: ['projectLead'] });

      if (!task) {
        throw new NotFoundException(`Task with ID ${taskId} not found`);
      }
      if (!project) {
        throw new NotFoundException(`Project with ID ${projectId} not found`);
      }

      // Block if user is on approved leave for any part of the worklog date range
      const leaves = await this.leaveService.findAll('approved');
      const worklogStart = moment.utc(startTime).format('YYYY-MM-DD');
      const worklogEnd = moment.utc(endTime).format('YYYY-MM-DD');
      const onLeave = leaves.some(leave => {
        return leave.user.id === user.id && worklogStart <= leave.endDate && worklogEnd >= leave.startDate;
      });
      if (onLeave) {
        throw new BadRequestException('You are on leave during this worklog period. Worklog is not allowed.');
      }

      // Block if any day in the worklog range is a holiday
      const holidays = await this.holidayService.findAll();
      const holidayDates = holidays.map(h => h.date);
      let isHoliday = false;
      let current = moment.utc(worklogStart);
      const end = moment.utc(worklogEnd);
      while (current.isSameOrBefore(end)) {
        if (holidayDates.includes(current.format('YYYY-MM-DD'))) {
          isHoliday = true;
          break;
        }
        current.add(1, 'day');
      }
      if (isHoliday) {
        throw new BadRequestException('One or more days in this worklog period are holidays. Worklog is not allowed.');
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
        status:'requested'
      });
      worklogs.push(worklog);

      if (createWorklogDto.approvalRequest) {
        await this.notificationService.create({ message: `Worklog added for approval`, users: [project.projectLead.id] });
      }
    }

    // Save all worklogs to the database at once
    const savedWorklogs = await this.worklogRepository.save(worklogs);
    // Log worklog addition in project timeline
    for (const worklog of savedWorklogs) {
      // Ensure task.project is loaded
      let taskWithProject = worklog.task;
      if (!taskWithProject.project) {
        taskWithProject = await this.taskRepository.findOne({
          where: { id: worklog.task.id },
          relations: ['project']
        });
      }
      await this.projectTimelineService.log({
        projectId: taskWithProject.project.id,
        userId: user.id,
        action: 'worklog_added',
        details: `Worklog added for task '${taskWithProject.name}' by user '${user.name}'.`
      });
    }
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

  
  async findRequest(user: UserEntity, status: 'open' | 'approved' | 'rejected' | 'pending' | 'requested') {
    return await this.worklogRepository.find({
      relations: ['user', 'task', 'task.project'],
      where: { approvedBy: user.id, status },
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
    const worklogs = await this.worklogRepository.find({
      where: { task: { id } },
      relations: ['user', 'task', 'task.project'],
      order: {
        createdAt: 'DESC'
      },
    });
    if (!worklogs || worklogs.length === 0) {
      throw new NotFoundException(`No worklogs found for task ID ${id}`);
    }
    return worklogs;
  }

  async update(id: string, updateWorklogDto: UpdateWorklogDto) {
    const worklog = await this.findOne(id);
    if (!worklog) {
      throw new NotFoundException(`Worklog with ID ${id} not found`);
    }
    // Handle taskId update
    if (updateWorklogDto.taskId) {
      const task = await this.taskRepository.findOne({ where: { id: updateWorklogDto.taskId } });
      if (!task) throw new NotFoundException(`Task with ID ${updateWorklogDto.taskId} not found`);
      worklog.task = task;
    }
    // Handle userId update
    if (updateWorklogDto.userId) {
      const user = await this.userRepository.findOne({ where: { id: updateWorklogDto.userId } });
      if (!user) throw new NotFoundException(`User with ID ${updateWorklogDto.userId} not found`);
      worklog.user = user;
    }
    // Assign other fields
    Object.assign(worklog, updateWorklogDto);
    return this.worklogRepository.save(worklog);
  return this.worklogRepository.save(worklog);
  }

  async remove(id: string) {
    return this.worklogRepository.delete(id);
  }
}
