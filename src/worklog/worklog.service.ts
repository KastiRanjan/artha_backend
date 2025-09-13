import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { LessThanOrEqual, MoreThanOrEqual, Repository, Between } from 'typeorm';
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
      const task = await this.taskRepository.findOne({ where: { id: taskId }, relations: ['project'] });
      
      // Derive projectId from task if not provided
      const actualProjectId = projectId || task?.project?.id;
      
      const project = await this.projectRepository.findOne({ where: { id: actualProjectId }, relations: ['projectLead'] });

      if (!task) {
        throw new NotFoundException(`Task with ID ${taskId} not found`);
      }
      if (!project) {
        throw new NotFoundException(`Project with ID ${actualProjectId} not found`);
      }

      // Convert provided times to proper Date objects and handle timezone
      let worklogStartTime: Date;
      let worklogEndTime: Date;
      
      if (startTime && endTime) {
        // Use the provided times as-is if they're already proper datetime strings
        worklogStartTime = new Date(startTime);
        worklogEndTime = new Date(endTime);
      } else {
        // Fallback to current time if no times provided (shouldn't happen in normal flow)
        const now = new Date();
        worklogStartTime = now;
        worklogEndTime = now;
      }

      // Block if user is on approved leave for any part of the worklog date range
      const leaves = await this.leaveService.findAll('approved');
      const worklogStart = moment(worklogStartTime).utcOffset('+05:45').format('YYYY-MM-DD');
      const worklogEnd = moment(worklogEndTime).utcOffset('+05:45').format('YYYY-MM-DD');
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
      let current = moment(worklogStart).utcOffset('+05:45');
      const end = moment(worklogEnd).utcOffset('+05:45');
      while (current.isSameOrBefore(end)) {
        if (holidayDates.includes(current.format('YYYY-MM-DD'))) {
          isHoliday = true;
          break;
        }
        current.add(1, 'day');
      }
      if (isHoliday) {
        throw new BadRequestException('Worklog is not allowed on holidays.');
      }

      // Check for overlapping worklogs using the actual worklog times
      // Only check for overlaps on the same date to avoid false positives across different days
      // Use Nepal time for date calculations
      const worklogDate = moment(worklogStartTime).utcOffset('+05:45').format('YYYY-MM-DD');
      const startOfDay = moment(worklogDate).utcOffset('+05:45').startOf('day').utc().toDate();
      const endOfDay = moment(worklogDate).utcOffset('+05:45').endOf('day').utc().toDate();
      
      // Find all worklogs for the user on the same date
      const existingWorklogs = await this.worklogRepository.find({
        where: {
          user: user.id,
          startTime: Between(startOfDay, endOfDay),
        },
      });

      // Check for time overlaps within the same date
      const hasOverlap = existingWorklogs.some(existingWorklog => {
        const existingStart = new Date(existingWorklog.startTime);
        const existingEnd = new Date(existingWorklog.endTime);
        
        // Check if the new worklog overlaps with any existing worklog
        return (
          (worklogStartTime < existingEnd && worklogEndTime > existingStart) ||
          (worklogStartTime.getTime() === existingStart.getTime()) ||
          (worklogEndTime.getTime() === existingEnd.getTime())
        );
      });

      if (hasOverlap) {
        throw new BadRequestException(`Overlapping worklog found on ${worklogDate}. Please check your existing worklogs for this date.`);
      }

      // Create a new worklog instance with the proper times
      const worklog = this.worklogRepository.create({
        ...worklogData,
        user,
        createdBy: user.id,
        task,
        project, // Add project reference
        startTime: worklogStartTime,
        endTime: worklogEndTime,
        status:'requested'
      });
      worklogs.push(worklog);
    }

    // Save all worklogs to the database at once
    const savedWorklogs = await this.worklogRepository.save(worklogs);
    
    // Send notification if approval is requested (check first worklog for approval request)
    if (createWorklogDto.length > 0 && createWorklogDto[0].approvalRequest) {
      // Get the project from the first worklog to send notification
      const firstWorklog = savedWorklogs[0];
      if (firstWorklog.project && firstWorklog.project.projectLead) {
        await this.notificationService.create({ 
          message: `Worklog added for approval`, 
          users: [firstWorklog.project.projectLead.id] 
        });
      }
    }
    
    // Log worklog addition in project timeline and update task status
    for (const worklog of savedWorklogs) {
      // Ensure task.project is loaded
      let taskWithProject = worklog.task;
      if (!taskWithProject.project) {
        taskWithProject = await this.taskRepository.findOne({
          where: { id: worklog.task.id },
          relations: ['project']
        });
      }
      
      // Update task status to in_progress if it's currently 'open'
      if (taskWithProject.status === 'open') {
        taskWithProject.status = 'in_progress';
        await this.taskRepository.save(taskWithProject);
        
        // Add a log entry for the status change
        await this.projectTimelineService.log({
          projectId: taskWithProject.project.id,
          userId: user.id,
          action: 'task_status_changed',
          details: `Task '${taskWithProject.name}' status changed from 'open' to 'in_progress' after worklog addition.`
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



  async findAll(user: UserEntity, status?: 'open' | 'approved' | 'rejected' | 'pending' | 'requested') {
    const whereCondition: any = { user };
    if (status) {
      whereCondition.status = status;
    }
    
    return await this.worklogRepository.find({
      relations: ['user', 'task', 'task.project'],
      where: whereCondition,
      order: {
        createdAt: 'DESC'
      }
    });
  }

  
  async findRequest(user: UserEntity, status?: 'open' | 'approved' | 'rejected' | 'pending' | 'requested') {
    const whereCondition: any = { approvedBy: user.id };
    if (status) {
      whereCondition.status = status;
    }
    
    return await this.worklogRepository.find({
      relations: ['user', 'task', 'task.project'],
      where: whereCondition,
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
