import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TodoTask, TodoTaskStatus } from './entities/todo-task.entity';
import { CreateTodoTaskDto } from './dto/create-todo-task.dto';
import { UpdateTodoTaskDto } from './dto/update-todo-task.dto';
import { UserEntity } from 'src/auth/entity/user.entity';
import { TaskTypeService } from 'src/task-type/task-type.service';
import { NotificationService } from 'src/notification/notification.service';

@Injectable()
export class TodoTaskService {
  constructor(
    @InjectRepository(TodoTask)
    private todoTaskRepository: Repository<TodoTask>,
    @InjectRepository(UserEntity)
    private userRepository: Repository<UserEntity>,
    private taskTypeService: TaskTypeService,
    private notificationService: NotificationService,
  ) {}

  async create(createTodoTaskDto: CreateTodoTaskDto, user: UserEntity): Promise<TodoTask> {
    // Verify task type exists
    await this.taskTypeService.findOne(createTodoTaskDto.taskTypeId);
    
    // Verify assigned user exists
    const assignedUser = await this.userRepository.findOne({ 
      where: { id: createTodoTaskDto.assignedToId } 
    });
    
    if (!assignedUser) {
      throw new NotFoundException(`User with ID "${createTodoTaskDto.assignedToId}" not found`);
    }
    
    const todoTask = this.todoTaskRepository.create({
      ...createTodoTaskDto,
      createdById: user.id,
      createdTimestamp: new Date(),
      status: TodoTaskStatus.OPEN,
    });
    
    const savedTask = await this.todoTaskRepository.save(todoTask);
    
    // Format due date for notification
    let dueDateStr = createTodoTaskDto.dueDate ? new Date(createTodoTaskDto.dueDate).toLocaleString() : 'No due date';
    await this.notificationService.create({
      users: [createTodoTaskDto.assignedToId],
      message: `Task "${createTodoTaskDto.title}" has been assigned to you with due date ${dueDateStr}.`,
      link: `/todotask/${savedTask.id}`
    });
    
    return savedTask;
  }

  async findAll(user: UserEntity, status?: TodoTaskStatus, assignedToId?: string): Promise<TodoTask[]> {
    // Print debug info
  
    const query = this.todoTaskRepository.createQueryBuilder('todoTask')
      .leftJoinAndSelect('todoTask.taskType', 'taskType')
      .leftJoinAndSelect('todoTask.createdByUser', 'createdBy')
      .leftJoinAndSelect('todoTask.assignedTo', 'assignedTo')
      .leftJoinAndSelect('todoTask.completedBy', 'completedBy');
    
    // Check if user has permission to view all tasks
    const hasViewAllPermission = user.role?.permission.some(
      (p: any) => 
        (p.resource === 'todo-task' && (p.method === 'view-all' || p.method === 'get' || p.method === 'manage'))
    );
    
    
    if (!hasViewAllPermission) {
      // If no view-all permission, only show tasks assigned to this user
      query.where('todoTask.assignedToId = :userId', { userId: user.id });
    } else {
      // Apply filters if provided
      if (status && assignedToId) {
        query.where('todoTask.status = :status AND todoTask.assignedToId = :assignedToId', { 
          status, assignedToId 
        });
      } else if (status) {
        query.where('todoTask.status = :status', { status });
      } else if (assignedToId) {
        query.where('todoTask.assignedToId = :assignedToId', { assignedToId });
      } else {
      }
    }
    
    const tasks = await query.orderBy('todoTask.createdTimestamp', 'DESC').getMany();
    return tasks;
  }

  async findOne(id: string, user: UserEntity): Promise<TodoTask> {
    const todoTask = await this.todoTaskRepository.findOne({ 
      where: { id },
      relations: ['taskType', 'createdByUser', 'assignedTo', 'completedBy']
    });
    
    if (!todoTask) {
      throw new NotFoundException(`Todo task with ID "${id}" not found`);
    }
    
    // Check if user is allowed to view this task
    const hasViewAllPermission = user.role?.permission.some(
      (p: any) => 
        (p.resource === 'todo-task' && (p.method === 'view-all' || p.method === 'get' || p.method === 'manage'))
    );
    
    if (!hasViewAllPermission && todoTask.assignedToId !== user.id && todoTask.createdById !== user.id) {
      throw new ForbiddenException(`You don't have permission to view this task`);
    }
    
    return todoTask;
  }

  async acknowledge(id: string, updateDto: UpdateTodoTaskDto, user: UserEntity): Promise<TodoTask> {
    const todoTask = await this.findOne(id, user);
    
    // Only assigned user can acknowledge
    if (todoTask.assignedToId !== user.id) {
      throw new ForbiddenException('Only the assigned user can acknowledge this task');
    }
    
    // Can only acknowledge if task is OPEN
    if (todoTask.status !== TodoTaskStatus.OPEN) {
      throw new ForbiddenException(`Cannot acknowledge task that is in "${todoTask.status}" status`);
    }
    
    await this.todoTaskRepository.update(id, {
      status: TodoTaskStatus.ACKNOWLEDGED,
      acknowledgedTimestamp: new Date(),
      acknowledgeRemark: updateDto.acknowledgeRemark,
    });
    
    // Send notification to creator
    await this.notificationService.create({
      users: [todoTask.createdById],
      message: `Task "${todoTask.title}" has been acknowledged by ${user.name || user.email}`,
      link: `/todotask/${id}`
    });
    
    return this.findOne(id, user);
  }

  async setPending(id: string, updateDto: UpdateTodoTaskDto, user: UserEntity): Promise<TodoTask> {
    const todoTask = await this.findOne(id, user);
    
    // Only assigned user can set to pending
    if (todoTask.assignedToId !== user.id) {
      throw new ForbiddenException('Only the assigned user can mark this task as pending');
    }
    
    // Can only set to pending if task is ACKNOWLEDGED
    if (todoTask.status !== TodoTaskStatus.ACKNOWLEDGED) {
      throw new ForbiddenException(`Cannot mark as pending a task that is in "${todoTask.status}" status`);
    }
    
    await this.todoTaskRepository.update(id, {
      status: TodoTaskStatus.PENDING,
      pendingTimestamp: new Date(),
      pendingRemark: updateDto.pendingRemark,
    });
    
    // Send notification to creator
    await this.notificationService.create({
      users: [todoTask.createdById],
      message: `Task "${todoTask.title}" has been marked as pending by ${user.name || user.email}`,
      link: `/todotask/${id}`
    });
    
    return this.findOne(id, user);
  }

  async complete(id: string, updateDto: UpdateTodoTaskDto, user: UserEntity): Promise<TodoTask> {
    const todoTask = await this.findOne(id, user);
    
    // Only assigned user can complete
    if (todoTask.assignedToId !== user.id) {
      throw new ForbiddenException('Only the assigned user can complete this task');
    }
    
    // Can only complete if task is ACKNOWLEDGED or PENDING
    if (todoTask.status !== TodoTaskStatus.ACKNOWLEDGED && todoTask.status !== TodoTaskStatus.PENDING) {
      throw new ForbiddenException(`Cannot complete task that is in "${todoTask.status}" status`);
    }
    
    await this.todoTaskRepository.update(id, {
      status: TodoTaskStatus.COMPLETED,
      completedById: user.id,
      completedTimestamp: new Date(),
      completionRemark: updateDto.completionRemark,
    });
    
    // Send notification to creator
    await this.notificationService.create({
      users: [todoTask.createdById],
      message: `Task "${todoTask.title}" has been completed by ${user.name || user.email}`,
      link: `/todotask/${id}`
    });
    
    return this.findOne(id, user);
  }

  async drop(id: string, updateDto: UpdateTodoTaskDto, user: UserEntity): Promise<TodoTask> {
    const todoTask = await this.findOne(id, user);
    
    // Only task creator or super user can drop a task
    const isSuperUser = user.role?.permission.some(
      (p: any) => p.resource === 'todo-task' && p.method === 'manage-all'
    );
    
    if (todoTask.createdById !== user.id && !isSuperUser) {
      throw new ForbiddenException('Only the task creator or administrators can drop this task');
    }
    
    // Cannot drop completed tasks
    if (todoTask.status === TodoTaskStatus.COMPLETED) {
      throw new ForbiddenException('Cannot drop a completed task');
    }
    
    await this.todoTaskRepository.update(id, {
      status: TodoTaskStatus.DROPPED,
      droppedTimestamp: new Date(),
      droppedRemark: updateDto.droppedRemark,
    });
    
    // Send notification to assigned user
    await this.notificationService.create({
      users: [todoTask.assignedToId],
      message: `Task "${todoTask.title}" has been dropped by ${user.name || user.email}`,
      link: `/todotask/${id}`
    });
    
    return this.findOne(id, user);
  }

  async update(id: string, updateTodoTaskDto: UpdateTodoTaskDto, user: UserEntity): Promise<TodoTask> {
    const todoTask = await this.findOne(id, user);
    
    // Only creator or admin can update task properties
    const isSuperUser = user.role?.permission.some(
      (p: any) => p.resource === 'todo-task' && p.method === 'manage-all'
    );
    
    if (todoTask.createdById !== user.id && !isSuperUser) {
      throw new ForbiddenException('Only the task creator or administrators can update task properties');
    }
    
    // Cannot change basic properties of non-open tasks
    if (todoTask.status !== TodoTaskStatus.OPEN && 
        (updateTodoTaskDto.title || updateTodoTaskDto.description || 
         updateTodoTaskDto.taskTypeId || updateTodoTaskDto.assignedToId)) {
      throw new ForbiddenException('Cannot update basic properties of a task that has been acknowledged');
    }
    
    // If changing task type, verify it exists
    if (updateTodoTaskDto.taskTypeId) {
      await this.taskTypeService.findOne(updateTodoTaskDto.taskTypeId);
    }
    
    // If changing assignee, verify user exists
    if (updateTodoTaskDto.assignedToId && updateTodoTaskDto.assignedToId !== todoTask.assignedToId) {
      const assignedUser = await this.userRepository.findOne({ 
        where: { id: updateTodoTaskDto.assignedToId } 
      });
      
      if (!assignedUser) {
        throw new NotFoundException(`User with ID "${updateTodoTaskDto.assignedToId}" not found`);
      }
      
      // Send notification to the new assignee
      await this.notificationService.create({
        users: [updateTodoTaskDto.assignedToId],
        message: `You have been assigned to task: ${todoTask.title} by ${user.name || user.email}`,
        link: `/todotask/${id}`
      });
    }
    
    await this.todoTaskRepository.update(id, updateTodoTaskDto);
    return this.findOne(id, user);
  }

  async remove(id: string, user: UserEntity): Promise<void> {
    const todoTask = await this.findOne(id, user);
    
    // Only creator or admin can delete tasks
    const isSuperUser = user.role?.permission.some(
      (p: any) => p.resource === 'todo-task' && p.method === 'manage-all'
    );
    
    if (todoTask.createdById !== user.id && !isSuperUser) {
      throw new ForbiddenException('Only the task creator or administrators can delete tasks');
    }
    
    // Cannot delete acknowledged or completed tasks
    if (todoTask.status !== TodoTaskStatus.OPEN) {
      throw new ForbiddenException(`Cannot delete task that is in "${todoTask.status}" status`);
    }
    
    const result = await this.todoTaskRepository.delete(id);
    
    if (result.affected === 0) {
      throw new NotFoundException(`Todo task with ID "${id}" not found`);
    }
  }
  
  async findAllByStatus(status: TodoTaskStatus, user: UserEntity): Promise<TodoTask[]> {
    const query = this.todoTaskRepository.createQueryBuilder('todoTask')
      .leftJoinAndSelect('todoTask.taskType', 'taskType')
      .leftJoinAndSelect('todoTask.createdByUser', 'createdBy')
      .leftJoinAndSelect('todoTask.assignedTo', 'assignedTo')
      .leftJoinAndSelect('todoTask.completedBy', 'completedBy')
      .where('todoTask.status = :status', { status });
    
    // Check if user has permission to view all tasks
    const hasViewAllPermission = user.role?.permission.some(
      (p: any) => p.resource === 'todo-task' && p.method === 'view-all'
    );
    
    if (!hasViewAllPermission) {
      // If no view-all permission, only show tasks assigned to this user
      query.andWhere('todoTask.assignedToId = :userId', { userId: user.id });
    }
    
    return query.orderBy('todoTask.createdTimestamp', 'DESC').getMany();
  }
  
  async findByAssignedUser(userId: string, user: UserEntity, status?: TodoTaskStatus): Promise<TodoTask[]> {    
    // Check if user has permission to view other users' tasks
    const hasViewAllPermission = user.role?.permission.some(
      (p: any) => 
        (p.resource === 'todo-task' && (p.method === 'view-all' || p.method === 'get' || p.method === 'manage'))
    );
    
    
    if (!hasViewAllPermission && userId !== user.id) {
      throw new ForbiddenException('You do not have permission to view other users\' tasks');
    }
    
    const query = this.todoTaskRepository.createQueryBuilder('todoTask')
      .leftJoinAndSelect('todoTask.taskType', 'taskType')
      .leftJoinAndSelect('todoTask.createdByUser', 'createdBy')
      .leftJoinAndSelect('todoTask.assignedTo', 'assignedTo')
      .leftJoinAndSelect('todoTask.completedBy', 'completedBy')
      .where('todoTask.assignedToId = :userId', { userId });
    
    if (status) {
      query.andWhere('todoTask.status = :status', { status });
    }
    
    const tasks = await query.orderBy('todoTask.createdTimestamp', 'DESC').getMany();
    return tasks;
  }
  
  async findByCreatedUser(userId: string, user: UserEntity, status?: TodoTaskStatus): Promise<TodoTask[]> {
    // Print debug info
    // Check if user has permission to view other users' tasks
    const hasViewAllPermission = user.role?.permission.some(
      (p: any) => 
        (p.resource === 'todo-task' && (p.method === 'view-all' || p.method === 'get' || p.method === 'manage'))
    );
    
    
    // If user doesn't have view-all permission and is trying to view another user's tasks
    if (!hasViewAllPermission && userId !== user.id) {
      throw new ForbiddenException('You do not have permission to view other users\' tasks');
    }
    
    const query = this.todoTaskRepository.createQueryBuilder('todoTask')
      .leftJoinAndSelect('todoTask.taskType', 'taskType')
      .leftJoinAndSelect('todoTask.createdByUser', 'createdBy')
      .leftJoinAndSelect('todoTask.assignedTo', 'assignedTo')
      .leftJoinAndSelect('todoTask.completedBy', 'completedBy')
      .where('todoTask.createdById = :userId', { userId });
    
    if (status) {
      query.andWhere('todoTask.status = :status', { status });
    }
    
    const tasks = await query.orderBy('todoTask.createdTimestamp', 'DESC').getMany();
    return tasks;
  }
}