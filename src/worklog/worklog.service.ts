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
	  const task = await this.taskRepository.findOne({ where: { id: taskId }, relations: ['project', 'parentTask'] });
	  // Derive projectId from task if not provided
	  const actualProjectId = projectId || task?.project?.id;
	  const project = await this.projectRepository.findOne({ where: { id: actualProjectId }, relations: ['projectLead'] });
	  if (!task) throw new NotFoundException(`Task with ID ${taskId} not found`);
	  if (!project) throw new NotFoundException(`Project with ID ${actualProjectId} not found`);
	  // Check worklog permissions based on project settings
	  const isSubtask = task.parentTask !== null;
	  const isMainTask = task.taskType === 'story' && task.parentTask === null;
	  if (!project.allowSubtaskWorklog && isSubtask) throw new BadRequestException('Worklog is not allowed for subtasks in this project. Only main tasks (stories) can have worklogs.');
	  if (!project.allowSubtaskWorklog && !isMainTask) throw new BadRequestException('Only main tasks (stories) can have worklogs in this project.');
	  // Convert provided times to proper Date objects and handle timezone
	  let worklogStartTime: Date;
	  let worklogEndTime: Date;
	  if (startTime && endTime) {
	    worklogStartTime = new Date(startTime);
	    worklogEndTime = new Date(endTime);
	  } else {
	    const now = new Date();
	    worklogStartTime = now;
	    worklogEndTime = now;
	  }
	  // Block if user is on approved leave for any part of the worklog date range
	  const leaves = await this.leaveService.findAll('approved');
	  const worklogStart = moment(worklogStartTime).utcOffset('+05:45').format('YYYY-MM-DD');
	  const worklogEnd = moment(worklogEndTime).utcOffset('+05:45').format('YYYY-MM-DD');
	  const onLeave = leaves.some(leave => leave.user.id === user.id && worklogStart <= leave.endDate && worklogEnd >= leave.startDate);
	  if (onLeave) throw new BadRequestException('You are on leave during this worklog period. Worklog is not allowed.');
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
	  if (isHoliday) throw new BadRequestException('Worklog is not allowed on holidays.');
	  // Check for overlapping worklogs using the actual worklog times
	  const worklogDate = moment(worklogStartTime).utcOffset('+05:45').format('YYYY-MM-DD');
	  const startOfDay = moment(worklogDate).utcOffset('+05:45').startOf('day').utc().toDate();
	  const endOfDay = moment(worklogDate).utcOffset('+05:45').endOf('day').utc().toDate();
	  const existingWorklogs = await this.worklogRepository.find({
	    where: { user: user.id, startTime: Between(startOfDay, endOfDay) },
	  });
	  const hasOverlap = existingWorklogs.some(existingWorklog => {
	    const existingStart = new Date(existingWorklog.startTime);
	    const existingEnd = new Date(existingWorklog.endTime);
	    return (
	      (worklogStartTime < existingEnd && worklogEndTime > existingStart) ||
	      (worklogStartTime.getTime() === existingStart.getTime()) ||
	      (worklogEndTime.getTime() === existingEnd.getTime())
	    );
	  });
	  if (hasOverlap) throw new BadRequestException(`Overlapping worklog found on ${worklogDate}. Please check your existing worklogs for this date.`);
	  // Create a new worklog instance with the proper times
	  const now = new Date();
	  const worklog = this.worklogRepository.create({
	    ...worklogData,
	    user,
	    createdBy: user.id,
	    task,
	    project,
	    startTime: worklogStartTime,
	    endTime: worklogEndTime,
	    status: 'requested',
	    requestedAt: now,
	    requestTo: worklogDto.requestTo || null // Always set requestTo from DTO
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
    const worklogs = await this.worklogRepository.find({
      relations: ['user', 'task', 'task.project'],
      where: whereCondition,
      order: {
        createdAt: 'DESC'
      }
    });
    // Populate approvedBy, requestTo, rejectBy with user objects
    for (const worklog of worklogs) {
      if (worklog.approvedBy) {
        (worklog as any).approvedByUser = await this.userRepository.findOne({ where: { id: worklog.approvedBy } });
      }
      if (worklog.requestTo) {
        (worklog as any).requestToUser = await this.userRepository.findOne({ where: { id: worklog.requestTo } });
      }
      if (worklog.rejectBy) {
        (worklog as any).rejectByUser = await this.userRepository.findOne({ where: { id: worklog.rejectBy } });
      }
    }
    return worklogs;
  }

  
  async findRequest(user: UserEntity, status?: 'open' | 'approved' | 'rejected' | 'pending' | 'requested') {
    let whereCondition: any = {};
    if (status === 'approved') {
      whereCondition = { approvedBy: user.id, requestTo: user.id, status: 'approved' };
    } else if (status === 'rejected') {
      whereCondition = { rejectBy: user.id, requestTo: user.id, status: 'rejected' };
    } else {
      // default to requested and others
      whereCondition = { requestTo: user.id };
      if (status) {
        whereCondition.status = status;
      }
    }
    const worklogs = await this.worklogRepository.find({
      relations: ['user', 'task', 'task.project'],
      where: whereCondition,
      order: {
        createdAt: 'DESC'
      }
    });
    for (const worklog of worklogs) {
      if (worklog.approvedBy) {
        (worklog as any).approvedByUser = await this.userRepository.findOne({ where: { id: worklog.approvedBy } });
      }
      if (worklog.requestTo) {
        (worklog as any).requestToUser = await this.userRepository.findOne({ where: { id: worklog.requestTo } });
      }
      if (worklog.rejectBy) {
        (worklog as any).rejectByUser = await this.userRepository.findOne({ where: { id: worklog.rejectBy } });
      }
    }
    return worklogs;
  }

  async findOne(id: string) {
    const worklog = await this.worklogRepository.findOne({
      relations: ['task', 'task.project.users','task.project'],
      where: { id }
    });
    if (!worklog) {
      throw new NotFoundException(`Worklog with ID ${id} not found`);
    }
    if (worklog.approvedBy) {
      (worklog as any).approvedByUser = await this.userRepository.findOne({ where: { id: worklog.approvedBy } });
    }
    if (worklog.requestTo) {
      (worklog as any).requestToUser = await this.userRepository.findOne({ where: { id: worklog.requestTo } });
    }
    if (worklog.rejectBy) {
      (worklog as any).rejectByUser = await this.userRepository.findOne({ where: { id: worklog.rejectBy } });
    }
    return worklog;
  }


  async findByTaskId(id: string) {
    const worklogs = await this.worklogRepository.find({
      where: { task: { id } },
      relations: ['user', 'task', 'task.project', 'task.parentTask'],
      order: {
        createdAt: 'DESC'
      },
    });
    if (!worklogs || worklogs.length === 0) {
      throw new NotFoundException(`No worklogs found for task ID ${id}`);
    }
    for (const worklog of worklogs) {
      if (worklog.approvedBy) {
        (worklog as any).approvedByUser = await this.userRepository.findOne({ where: { id: worklog.approvedBy } });
      }
      if (worklog.requestTo) {
        (worklog as any).requestToUser = await this.userRepository.findOne({ where: { id: worklog.requestTo } });
      }
      if (worklog.rejectBy) {
        (worklog as any).rejectByUser = await this.userRepository.findOne({ where: { id: worklog.rejectBy } });
      }
    }
    return worklogs;
  }

  async checkWorklogAllowed(taskId: string) {
    const task = await this.taskRepository.findOne({ 
      where: { id: taskId }, 
      relations: ['project', 'parentTask'] 
    });
    
    if (!task) {
      throw new NotFoundException(`Task with ID ${taskId} not found`);
    }
    
    if (!task.project) {
      throw new NotFoundException(`Project not found for task ID ${taskId}`);
    }

    const isSubtask = task.parentTask !== null;
    const isMainTask = task.taskType === 'story' && task.parentTask === null;
    
    // Check if worklog is allowed based on project settings
    const allowWorklog = task.project.allowSubtaskWorklog || isMainTask;
    
    return {
      allowed: allowWorklog,
      reason: allowWorklog 
        ? 'Worklog is allowed for this task' 
        : isSubtask 
          ? 'Worklog is not allowed for subtasks in this project' 
          : 'Only main tasks (stories) can have worklogs in this project',
      isSubtask,
      isMainTask,
      projectAllowsSubtaskWorklog: task.project.allowSubtaskWorklog
    };
  }

  async update(id: string, updateWorklogDto: UpdateWorklogDto, user: UserEntity) {
    const worklog = await this.findOne(id);
    if (!worklog) {
      throw new NotFoundException(`Worklog with ID ${id} not found`);
    }
    
    // Update status timestamp based on status
    if (updateWorklogDto.status) {
      const now = new Date();
      if (updateWorklogDto.status === 'approved') {
        worklog.approvedAt = now;
        worklog.approvedBy = user.id;
      } else if (updateWorklogDto.status === 'rejected') {
        worklog.rejectedAt = now;
        worklog.rejectedRemark = updateWorklogDto.rejectedRemark || '';
        worklog.rejectBy = user.id;
      } else if (updateWorklogDto.status === 'requested') {
        worklog.requestedAt = now;
      }
    }
    
    // Permission check for editing worklog date
    if (updateWorklogDto.date && worklog.startTime) {
      // Check if user has permission for PATCH /worklogs/:id and 'edit_worklog_date'
      const hasRoutePermission = user?.role?.permission?.some(
        (perm: any) => perm.path === '/worklogs/:id' && perm.method === 'patch'
      );
      const hasEditDatePermission = user?.role?.permission?.some(
        (perm: any) => perm.name === 'edit_worklog_date'
      );
      if (!hasRoutePermission || !hasEditDatePermission) {
        throw new BadRequestException('You do not have permission to edit the worklog date.');
      }
      // If allowed, update the date (startTime/endTime)
      const newDate = updateWorklogDto.date;
      // Update startTime and endTime to new date, keeping time
      const startTime = new Date(worklog.startTime);
      const endTime = new Date(worklog.endTime);
      const newStart = new Date(newDate);
      newStart.setHours(startTime.getHours(), startTime.getMinutes(), startTime.getSeconds(), startTime.getMilliseconds());
      const newEnd = new Date(newDate);
      newEnd.setHours(endTime.getHours(), endTime.getMinutes(), endTime.getSeconds(), endTime.getMilliseconds());
      worklog.startTime = newStart;
      worklog.endTime = newEnd;
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
    
    // Handle requestTo update
    if (updateWorklogDto.requestTo) {
      worklog.requestTo = updateWorklogDto.requestTo;
    }
    
    // Assign other fields except date
    Object.keys(updateWorklogDto).forEach(key => {
      if (key !== 'date') {
        (worklog as any)[key] = (updateWorklogDto as any)[key];
      }
    });
    
    return this.worklogRepository.save(worklog);
  }

  async findByUserAndDate(userId: string, date: string) {
    const startOfDay = moment(date).startOf('day').toDate();
    const endOfDay = moment(date).endOf('day').toDate();
    const worklogs = await this.worklogRepository.find({
      where: {
        user: { id: userId },
        startTime: Between(startOfDay, endOfDay),
      },
      relations: ['user', 'task', 'task.project'],
      order: {
        startTime: 'ASC'
      }
    });
    for (const worklog of worklogs) {
      if (worklog.approvedBy) {
        (worklog as any).approvedByUser = await this.userRepository.findOne({ where: { id: worklog.approvedBy } });
      }
      if (worklog.requestTo) {
        (worklog as any).requestToUser = await this.userRepository.findOne({ where: { id: worklog.requestTo } });
      }
      if (worklog.rejectBy) {
        (worklog as any).rejectByUser = await this.userRepository.findOne({ where: { id: worklog.rejectBy } });
      }
    }
    return worklogs;
  }

  async findAllUsersByDate(date: string) {
    const startOfDay = moment(date).startOf('day').toDate();
    const endOfDay = moment(date).endOf('day').toDate();
    const worklogs = await this.worklogRepository.find({
      where: {
        startTime: Between(startOfDay, endOfDay),
      },
      relations: ['user', 'task', 'task.project'],
      order: {
        startTime: 'ASC'
      }
    });
    for (const worklog of worklogs) {
      if (worklog.approvedBy) {
        (worklog as any).approvedByUser = await this.userRepository.findOne({ where: { id: worklog.approvedBy } });
      }
      if (worklog.requestTo) {
        (worklog as any).requestToUser = await this.userRepository.findOne({ where: { id: worklog.requestTo } });
      }
      if (worklog.rejectBy) {
        (worklog as any).rejectByUser = await this.userRepository.findOne({ where: { id: worklog.rejectBy } });
      }
    }
    return worklogs;
  }
  
  async findAllWorklog(status?: string, date?: string, userId?: string, projectId?: string) {
    const whereCondition: any = {};
    if (status) {
      whereCondition.status = status;
    }
    if (userId) {
      whereCondition.user = { id: userId };
    }
    if (projectId) {
      whereCondition.project = { id: projectId };
    }
    if (date) {
      const startOfDay = moment(date).startOf('day').toDate();
      const endOfDay = moment(date).endOf('day').toDate();
      whereCondition.startTime = Between(startOfDay, endOfDay);
    }
    const worklogs = await this.worklogRepository.find({
      relations: ['user', 'task', 'task.project', 'project'],
      where: whereCondition,
      order: {
        createdAt: 'DESC'
      }
    });
    for (const worklog of worklogs) {
      if (worklog.approvedBy) {
        (worklog as any).approvedByUser = await this.userRepository.findOne({ where: { id: worklog.approvedBy } });
      }
      if (worklog.requestTo) {
        (worklog as any).requestToUser = await this.userRepository.findOne({ where: { id: worklog.requestTo } });
      }
      if (worklog.rejectBy) {
        (worklog as any).rejectByUser = await this.userRepository.findOne({ where: { id: worklog.rejectBy } });
      }
    }
    return worklogs;
  }

  async remove(id: string) {
    return this.worklogRepository.delete(id);
  }
}
