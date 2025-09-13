import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as dotenv from 'dotenv';
import { UserEntity } from 'src/auth/entity/user.entity';
import { Billing } from 'src/billing/entities/billing.entity';
import { Customer } from 'src/customers/entities/customer.entity';
import { NatureOfWork } from 'src/nature-of-work/entities/nature-of-work.entity';
import { NotificationService } from 'src/notification/notification.service';
import { Repository } from 'typeorm';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { Project } from './entities/project.entity';
import { ProjectTimelineService } from './project-timeline.service';
import { ProjectDateFormatter } from './utils/date-formatter.util';
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
      ...projectData
    } = createProjectDto;
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
    const billingEntity = billing ? await this.billingRepository.findOne({ where: { id: billing } }) : null;
    const natureOfWorkEntity = await this.natureOfWorkRepository.findOne({ where: { id: natureOfWorkId } });
    
    if (!natureOfWorkEntity) {
      throw new Error(`Nature of work with ID ${natureOfWorkId} not found`);
    }
    
    // Create a new project and assign the fetched users
    const project = this.projectRepository.create({
      ...projectData,
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
      link: `${process.env.frontendUrl}/projects/${savedProject.id}`
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
          updatedAt: 'DESC'
        }
      });
    } else {
      const users = await this.userRepository.findOne({
        relations: ['projects', 'projects.projectLead', 'projects.users', 'projects.projectManager', 'projects.billing', 'projects.customer', 'projects.users.role', 'projects.natureOfWork'],
        where: {
          id: user.id
        }
      });
      projects = users.projects;
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
        'tasks.group',
        'tasks.subTasks',
        'tasks.subTasks.assignees',
        'tasks.subTasks.group', 
        'tasks.parentTask',
        'tasks.parentTask.assignees',
        'tasks.parentTask.group',
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
        link: `${process.env.frontendUrl}/projects/${updatedProject.id}`
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
}
