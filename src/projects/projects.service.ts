import { Injectable } from '@nestjs/common';
import { BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as dotenv from 'dotenv';
import { UserEntity } from 'src/auth/entity/user.entity';
import { Billing } from 'src/billing/entities/billing.entity';
import { Customer } from 'src/customers/entities/customer.entity';
import { NatureOfWork } from 'src/nature-of-work/entities/nature-of-work.entity';
import { NotificationService } from 'src/notification/notification.service';
import { NotificationType } from 'src/notification/enums/notification-type.enum';
import { Repository } from 'typeorm';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { AddFromTemplatesDto } from './dto/add-from-templates.dto';
import { CompleteProjectDto } from './dto/complete-project.dto';
import { Project } from './entities/project.entity';
import { ProjectTimelineService } from './project-timeline.service';
import { ProjectDateFormatter } from './utils/date-formatter.util';
import { TaskSuperProject } from 'src/task-super/entities/task-super-project.entity';
import { TaskGroupProject } from 'src/task-groups/entities/task-group-project.entity';
import { Task } from 'src/tasks/entities/task.entity';
import { TaskSuper } from 'src/task-super/entities/task-super.entity';
import { TaskGroup } from 'src/task-groups/entities/task-group.entity';
import { TaskTemplate } from 'src/task-template/entities/task-template.entity';
dotenv.config();

@Injectable()
export class ProjectsService {
  constructor(
    @InjectRepository(Project) private projectRepository: Repository<Project>,
    @InjectRepository(Customer)
    private customerRepository: Repository<Customer>,
    @InjectRepository(UserEntity)
    private userRepository: Repository<UserEntity>,
    @InjectRepository(Billing)
    private billingRepository: Repository<Billing>,
    @InjectRepository(NatureOfWork)
    private natureOfWorkRepository: Repository<NatureOfWork>,
    @InjectRepository(TaskSuperProject)
    private taskSuperProjectRepository: Repository<TaskSuperProject>,
    @InjectRepository(TaskGroupProject)
    private taskGroupProjectRepository: Repository<TaskGroupProject>,
    @InjectRepository(Task)
    private taskRepository: Repository<Task>,
    @InjectRepository(TaskSuper)
    private taskSuperRepository: Repository<TaskSuper>,
    @InjectRepository(TaskGroup)
    private taskGroupRepository: Repository<TaskGroup>,
    @InjectRepository(TaskTemplate)
    private taskTemplateRepository: Repository<TaskTemplate>,
    private readonly notificationService: NotificationService,
    private readonly projectTimelineService: ProjectTimelineService
  ) {}
  async create(createProjectDto: CreateProjectDto) {
    const {
      users: userIds,
      projectLead,
      projectManager,
      customer,
      client, // Add client property
      billing,
      natureOfWork: natureOfWorkId,
      name,
      ...projectData
    } = createProjectDto;

    // Check for duplicate project name
    const existingProject = await this.projectRepository.findOne({ where: { name } });
    if (existingProject) {
      // Use BadRequestException so frontend gets a 400 error and message
      // Import BadRequestException from @nestjs/common
      // If not imported, add: import { BadRequestException } from '@nestjs/common';
      throw new BadRequestException('A project with this name already exists. Please choose a different name.');
    }

    // Fetch the user entities using the user IDs
    const users = await this.userRepository.findByIds(userIds || []);
    const lead = projectLead ? await this.userRepository.findOne({ where: { id: projectLead } }) : null;
    let manager = null;
    if (projectManager) {
      manager = await this.userRepository.findOne({ where: { id: projectManager }, relations: ['role'] });
      if (!manager || manager.role?.name !== 'projectmanager') {
        throw new Error('Assigned projectManager must have role "projectmanager"');
      }
    }
    // Use either customer or client property (frontend sends client, backend uses customer)
    const customerId = customer || client;
    const clientEntity = customerId ? await this.customerRepository.findOne({ where: { id: customerId } }) : null;
    if (clientEntity && clientEntity.status === 'suspended') {
      throw new Error('Cannot create project for suspended client');
    }
    const billingEntity = billing ? await this.billingRepository.findOne({ where: { id: billing } }) : null;
    const natureOfWorkEntity = await this.natureOfWorkRepository.findOne({ where: { id: natureOfWorkId } });

    if (!natureOfWorkEntity) {
      throw new Error(`Nature of work with ID ${natureOfWorkId} not found`);
    }

    // Create a new project and assign the fetched users
    const project = this.projectRepository.create({
      ...projectData,
      name,
      users, // Assign the user entities here
      projectLead: lead,
      projectManager: manager,
      customer: clientEntity,
      billing: billingEntity,
      natureOfWork: natureOfWorkEntity
    });

    const savedProject = await this.projectRepository.save(project);

    await this.notificationService.create({
      message: `Project ${savedProject.name} created`,
      users: userIds,
      link: `${process.env.frontendUrl}/projects/${savedProject.id}`,
      type: NotificationType.PROJECT
    });
    // Log project creation in timeline
    await this.projectTimelineService.log({
      projectId: savedProject.id,
      userId: lead?.id,
      action: 'project_created',
      details: `Project created with users: ${userIds?.join(', ')}`
    });
    // Save the project with associated users
    return savedProject;
  }

  async findAll(
    status: 'active' | 'suspended' | 'archived' | 'signed_off' | 'completed',
    user: UserEntity
  ) {
    let projects = null;

    if (user.role.name === 'superuser') {
      projects = await this.projectRepository.find({
        where: {
          status: status
        },
        relations: ['users', 'tasks', 'projectLead', 'customer', 'billing', 'projectManager', 'users.role', 'natureOfWork'],
        order: {
          name: 'ASC' // Order alphabetically by name
        }
      });
    } else {
      const users = await this.userRepository.findOne({
        relations: ['projects', 'projects.projectLead', 'projects.users', 'projects.projectManager', 'projects.billing', 'projects.customer', 'projects.users.role', 'projects.natureOfWork'],
        where: {
          id: user.id
        }
      });
      projects = users.projects.filter(project => project.status === status);
      // Sort alphabetically by name for non-superuser
      projects = projects.sort((a, b) => a.name.localeCompare(b.name));
    }
    // Add Nepali date formatting to each project
    return projects.map(project => ProjectDateFormatter.addNepaliDates(project));
  }

  async findOne(id: string) {
    const project = await this.projectRepository.findOne({
      where: { id },
      relations: [
        'users', 
        'tasks', 
        'projectLead', 
        'projectManager', 
        'tasks.assignees', 
        'tasks.groupProject',
        'tasks.groupProject.taskSuper',
        'tasks.subTasks',
        'tasks.subTasks.assignees',
        'tasks.subTasks.groupProject', 
        'tasks.parentTask',
        'tasks.parentTask.assignees',
        'tasks.parentTask.groupProject',
        'billing', 
        'customer', 
        'natureOfWork'
      ]
    });
    
    if (!project) {
      return null;
    }
    
    return ProjectDateFormatter.addNepaliDates(project);
  }

  async update(id: string, updateProjectDto: UpdateProjectDto) {
    // Find the project by its ID
    const project = await this.projectRepository.findOne({
      where: { id },
      relations: ['users']
    });

    // If the project is not found, you can throw an error or handle it accordingly
    if (!project) {
      throw new Error(`Project with ID ${id} not found`);
    }

    // Restructure updateProjectDto to extract properties we need to handle specially
    const {
      users,
      projectLead,
      projectManager,
      customer,
      client, // Add client property
      billing,
      natureOfWork,
      ...otherUpdates
    } = updateProjectDto;

    // Update project properties with the new values for simple fields
    Object.assign(project, otherUpdates);

    // If there are user updates, handle them
    if (users) {
      const userEntities = await this.userRepository.findByIds(users);
      project.users = userEntities; // Update users if provided
    }
    
    if (projectLead) {
      const lead = await this.userRepository.findOne({ where: { id: projectLead } });
      project.projectLead = lead || null;
    }
    
    if (projectManager) {
      const manager = await this.userRepository.findOne({ where: { id: projectManager }, relations: ['role'] });
      if (!manager || manager.role?.name !== 'projectmanager') {
        throw new Error('Assigned projectManager must have role "manager"');
      }
      project.projectManager = manager;
    }
    
    // Use either customer or client property (frontend sends client, backend uses customer)
    const customerId = customer || client;
    if (customerId) {
      const clientEntity = await this.customerRepository.findOne({ where: { id: customerId } });
      project.customer = clientEntity || null;
    }
    
    if (billing) {
      const billingEntity = await this.billingRepository.findOne({ where: { id: billing } });
      project.billing = billingEntity || null;
    }
    
    if (natureOfWork) {
      const natureOfWorkEntity = await this.natureOfWorkRepository.findOne({ where: { id: natureOfWork } });
      if (!natureOfWorkEntity) {
        throw new Error(`Nature of work with ID ${natureOfWork} not found`);
      }
      project.natureOfWork = natureOfWorkEntity;
    }
    
    if (updateProjectDto.natureOfWork) {
      const natureOfWorkEntity = await this.natureOfWorkRepository.findOne({ where: { id: updateProjectDto.natureOfWork } });
      if (!natureOfWorkEntity) {
        throw new Error(`Nature of work with ID ${updateProjectDto.natureOfWork} not found`);
      }
      project.natureOfWork = natureOfWorkEntity;
    }

    // Save the updated project back to the repository
    const updatedProject = await this.projectRepository.save(project);

    if (users) {
      await this.notificationService.create({
        message: `Project ${updatedProject.name} updated`,
        users: users,
        link: `${process.env.frontendUrl}/projects/${updatedProject.id}`,
        type: NotificationType.PROJECT
      });
    }
    
    return ProjectDateFormatter.addNepaliDates(updatedProject);
  }

  async remove(id: string) {
    // Find the project by its ID
    const project = await this.projectRepository.findOne({
      where: { id }
    });

    // If the project is not found, you can throw an error or handle it accordingly
    if (!project) {
      throw new Error(`Project with ID ${id} not found`);
    }

    // Remove the project
    await this.projectRepository.remove(project);

    // Optionally, return a success message or the removed project
    return { message: `Project with ID ${id} removed successfully` };
  }
  async findByUserId(id: string) {
    const projects = await this.projectRepository.find({
      where: {
        users: {
          id: id
        }
      },
      relations: ['users', 'natureOfWork']
    });
    
    if (!projects || projects.length === 0) {
      return [];
    }
    
    return projects.map(project => ProjectDateFormatter.addNepaliDates(project));
  }

  async addFromTemplates(dto: AddFromTemplatesDto) {
    // Find the project
    const project = await this.projectRepository.findOne({
      where: { id: dto.projectId },
      relations: ['users']
    });

    if (!project) {
      throw new Error(`Project with ID ${dto.projectId} not found`);
    }

    // Process each task super
    const taskSuperProjectMap = new Map<string, TaskSuperProject>();
    for (const taskSuperItem of dto.taskSupers || []) {
      // Find the original task super
      const taskSuper = await this.taskSuperRepository.findOne({
        where: { id: taskSuperItem.id }
      });

      if (!taskSuper) {
        throw new Error(`Task Super with ID ${taskSuperItem.id} not found`);
      }

      // Create task super project
      const taskSuperProject = this.taskSuperProjectRepository.create({
        name: taskSuperItem.name,
        description: taskSuper.description || '',
        rank: taskSuper.rank || 0,
        project,
        projectId: project.id,
        originalTaskSuperId: taskSuperItem.id
      });

      const savedTaskSuperProject = await this.taskSuperProjectRepository.save(taskSuperProject);
      taskSuperProjectMap.set(taskSuperItem.id, savedTaskSuperProject);
    }

    // Process each task group
    const taskGroupProjectMap = new Map<string, TaskGroupProject>();
    for (const taskGroupItem of dto.taskGroups || []) {
      // Find the original task group
      const taskGroup = await this.taskGroupRepository.findOne({
        where: { id: taskGroupItem.id }
      });

      if (!taskGroup) {
        throw new Error(`Task Group with ID ${taskGroupItem.id} not found`);
      }

      // Get parent task super project if exists
      let taskSuperProject = null;
      let taskSuperId = null;
      if (taskGroupItem.taskSuperId && taskSuperProjectMap.has(taskGroupItem.taskSuperId)) {
        taskSuperProject = taskSuperProjectMap.get(taskGroupItem.taskSuperId);
        taskSuperId = taskSuperProject.id;
      }

      // Create task group project
      const taskGroupProject = this.taskGroupProjectRepository.create({
        name: taskGroupItem.name,
        description: taskGroup.description || '',
        rank: taskGroup.rank || 0,
        project,
        projectId: project.id,
        taskSuper: taskSuperProject,
        taskSuperId,
        originalTaskGroupId: taskGroupItem.id
      });

      const savedTaskGroupProject = await this.taskGroupProjectRepository.save(taskGroupProject);
      taskGroupProjectMap.set(taskGroupItem.id, savedTaskGroupProject);
    }

    // Process each task template
    const taskMap = new Map<string, Task>();
    for (const templateItem of dto.taskTemplates || []) {
      // Find the original task template
      const template = await this.taskTemplateRepository.findOne({
        where: { id: templateItem.id },
        relations: ['taskGroup']
      });

      if (!template) {
        throw new Error(`Task Template with ID ${templateItem.id} not found`);
      }

      // Get parent task group project
      let groupProject = null;
      if (templateItem.taskGroupId && taskGroupProjectMap.has(templateItem.taskGroupId)) {
        groupProject = taskGroupProjectMap.get(templateItem.taskGroupId);
      }

      // Create task from template - using the exact name provided from frontend
      const task = this.taskRepository.create({
        name: templateItem.name, // This name already has the suffix applied from frontend
        description: template.description || '',
        budgetedHours: templateItem.budgetedHours,
        project,
        groupProject,
        status: 'open',
        priority: 'medium',
        taskType: template.taskType || 'story',
        rank: template.rank || 0,
        dueDate: project.endingDate
      });

      const savedTask = await this.taskRepository.save(task);
      taskMap.set(templateItem.id, savedTask);
    }

    // Process each subtask
    for (const subtaskItem of dto.subtasks || []) {
      // Find the parent task
      let parentTask = null;
      if (subtaskItem.parentId && taskMap.has(subtaskItem.parentId)) {
        parentTask = taskMap.get(subtaskItem.parentId);
      }

      if (!parentTask) {
        throw new Error(`Parent task for subtask ${subtaskItem.id} not found`);
      }

      // Create subtask - using the exact name provided from frontend
      const subtask = this.taskRepository.create({
        name: subtaskItem.name, // This name already has the suffix applied from frontend
        description: '',
        budgetedHours: subtaskItem.budgetedHours,
        project,
        groupProject: parentTask.groupProject,
        status: 'open',
        priority: 'medium',
        taskType: 'task',
        rank: 0,
        dueDate: project.endingDate,
        parentTask
      });

      await this.taskRepository.save(subtask);
    }

    // Log in timeline
    await this.projectTimelineService.log({
      projectId: project.id,
      action: 'tasks_added_from_templates',
      details: `Tasks added from templates: ${dto.taskTemplates?.length || 0} templates, ${dto.subtasks?.length || 0} subtasks`
    });

    // Return success message
    return {
      message: 'Templates successfully added to project',
      taskSupers: dto.taskSupers?.length || 0,
      taskGroups: dto.taskGroups?.length || 0,
      tasks: dto.taskTemplates?.length || 0,
      subtasks: dto.subtasks?.length || 0
    };
  }

  async completeProject(id: string, user: UserEntity): Promise<Project> {
    // Find project with all necessary relations
    const project = await this.projectRepository.findOne({
      where: { id },
      relations: ['tasks', 'tasks.subTasks', 'projectLead', 'projectManager', 'users']
    });

    if (!project) {
      throw new Error(`Project with ID ${id} not found`);
    }

    // Check if user is authorized (project lead or project manager)
    const isProjectLead = project.projectLead?.id === user.id;
    const isProjectManager = project.projectManager?.id === user.id;
    const isSuperUser = user.role?.name === 'superuser';

    if (!isProjectLead && !isProjectManager && !isSuperUser) {
      throw new Error('Only project lead or project manager can mark project as completed');
    }

    // Check if all tasks are completed
    const allTasks = project.tasks || [];
    const incompleteTasks = allTasks.filter(task => {
      // Check main task status
      if (task.status !== 'done') {
        return true;
      }
      
      // Check subtasks status
      const hasIncompleteSubtasks = task.subTasks?.some(subtask => subtask.status !== 'done');
      return hasIncompleteSubtasks;
    });

    if (incompleteTasks.length > 0) {
      const incompleteTaskNames = incompleteTasks.map(t => t.name).join(', ');
      throw new Error(
        `Cannot complete project. ${incompleteTasks.length} task(s) are not completed: ${incompleteTaskNames}`
      );
    }

    // Update project status
    project.status = 'completed';
    const updatedProject = await this.projectRepository.save(project);

    // Log in timeline
    await this.projectTimelineService.log({
      projectId: project.id,
      userId: user.id,
      action: 'project_completed',
      details: `Project marked as completed by ${user.name}`
    });

    // Send notifications to all project members
    const userIds = project.users?.map(u => u.id) || [];
    if (userIds.length > 0) {
      await this.notificationService.create({
        message: `Project ${project.name} has been marked as completed`,
        users: userIds,
        link: `${process.env.frontendUrl}/projects/${project.id}`,
        type: NotificationType.PROJECT
      });
    }

    return updatedProject;
  }
}
