import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProjectEvaluation } from './entities/project-evaluation.entity';
import { CreateProjectEvaluationDto } from './dto/create-project-evaluation.dto';
import { UpdateProjectEvaluationDto } from './dto/update-project-evaluation.dto';
import { Project } from 'src/projects/entities/project.entity';
import { UserEntity } from 'src/auth/entity/user.entity';

@Injectable()
export class ProjectEvaluationService {
  constructor(
    @InjectRepository(ProjectEvaluation)
    private evaluationRepository: Repository<ProjectEvaluation>,
    @InjectRepository(Project)
    private projectRepository: Repository<Project>,
    @InjectRepository(UserEntity)
    private userRepository: Repository<UserEntity>,
  ) {}

  async create(
    createDto: CreateProjectEvaluationDto,
    evaluatedBy: UserEntity
  ): Promise<ProjectEvaluation> {
    // Verify project exists and is completed
    const project = await this.projectRepository.findOne({
      where: { id: createDto.projectId },
      relations: ['projectLead', 'projectManager', 'users', 'users.role']
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    if (project.status !== 'completed') {
      throw new BadRequestException('Project must be completed before evaluation');
    }

    // Verify evaluated user exists and was part of the project
    const evaluatedUser = await this.userRepository.findOne({
      where: { id: createDto.evaluatedUserId },
      relations: ['role']
    });

    if (!evaluatedUser) {
      throw new NotFoundException('Evaluated user not found');
    }

    const isUserInProject = project.users.some(u => u.id === evaluatedUser.id);
    if (!isUserInProject) {
      throw new BadRequestException('User was not part of this project');
    }

    // Check if evaluation already exists
    const existing = await this.evaluationRepository.findOne({
      where: {
        projectId: createDto.projectId,
        evaluatedUserId: createDto.evaluatedUserId
      }
    });

    if (existing) {
      throw new BadRequestException('Evaluation already exists for this user on this project');
    }

    // Get evaluator role and position
    const evaluatorRole = evaluatedBy.role.name.toLowerCase();
    const isProjectLead = project.projectLead?.id === evaluatedBy.id;
    // Manager-level roles include: projectmanager, manager, administrator, and superuser
    const managerRoles = ['projectmanager', 'manager', 'administrator', 'admin', 'superuser'];
    const isManagerLevel = managerRoles.includes(evaluatorRole);
    
    // Prevent self-evaluation
    if (evaluatedUser.id === evaluatedBy.id) {
      throw new BadRequestException('Cannot evaluate yourself');
    }
    
    // Don't allow evaluation of projectmanager, administrator or superuser roles
    const evaluatedUserRole = evaluatedUser.role.name.toLowerCase();
    const protectedRoles = ['projectmanager', 'administrator', 'admin', 'superuser'];
    if (protectedRoles.includes(evaluatedUserRole)) {
      throw new BadRequestException('Cannot evaluate users with project manager, administrator or superuser roles');
    }

    // Role-based evaluation authorization
    // Project lead (who is not manager-level) can evaluate audit senior and audit junior only
    if (isProjectLead && !isManagerLevel) {
      const allowedRoles = ['auditsenior', 'auditjunior'];
      if (!allowedRoles.includes(evaluatedUserRole)) {
        throw new BadRequestException('Project lead can only evaluate audit senior and audit junior members');
      }
    }

    // Manager-level users (projectmanager, manager, administrator, superuser) can evaluate all team members
    // Project leads who are not manager-level can only evaluate audit senior/junior (checked above)
    if (!isProjectLead && !isManagerLevel) {
      throw new BadRequestException('Only project lead or manager-level users can evaluate team members');
    }

    // Determine if user is team lead
    const isTeamLead = project.projectLead?.id === evaluatedUser.id;

    // Validate team lead criteria
    if (isTeamLead && (!createDto.harmony || !createDto.coordination)) {
      throw new BadRequestException('Team lead evaluation requires harmony and coordination ratings');
    }

    const evaluation = this.evaluationRepository.create({
      ...createDto,
      evaluatedBy,
      evaluatedById: evaluatedBy.id,
      isTeamLead
    });

    return this.evaluationRepository.save(evaluation);
  }

  async findAll(): Promise<ProjectEvaluation[]> {
    return this.evaluationRepository.find({
      relations: ['project', 'evaluatedUser', 'evaluatedBy']
    });
  }

  async findByProject(projectId: string): Promise<ProjectEvaluation[]> {
    return this.evaluationRepository.find({
      where: { projectId },
      relations: ['evaluatedUser', 'evaluatedBy', 'evaluatedUser.role']
    });
  }

  async findByUser(userId: string): Promise<ProjectEvaluation[]> {
    return this.evaluationRepository.find({
      where: { evaluatedUserId: userId },
      relations: ['project', 'evaluatedBy']
    });
  }

  async findOne(id: string): Promise<ProjectEvaluation> {
    const evaluation = await this.evaluationRepository.findOne({
      where: { id },
      relations: ['project', 'evaluatedUser', 'evaluatedBy']
    });

    if (!evaluation) {
      throw new NotFoundException('Evaluation not found');
    }

    return evaluation;
  }

  async update(
    id: string,
    updateDto: UpdateProjectEvaluationDto,
    user: UserEntity
  ): Promise<ProjectEvaluation> {
    const evaluation = await this.findOne(id);

    // Only the evaluator or manager-level users can update
    const userRole = user.role.name.toLowerCase();
    const managerRoles = ['projectmanager', 'manager', 'administrator', 'admin', 'superuser'];
    const isManagerLevel = managerRoles.includes(userRole);
    
    if (evaluation.evaluatedById !== user.id && !isManagerLevel) {
      throw new BadRequestException('Only the evaluator or manager-level users can update this evaluation');
    }

    Object.assign(evaluation, updateDto);
    return this.evaluationRepository.save(evaluation);
  }

  async remove(id: string, user: UserEntity): Promise<void> {
    const evaluation = await this.findOne(id);

    // Only the evaluator or manager-level users can delete
    const userRole = user.role.name.toLowerCase();
    const managerRoles = ['projectmanager', 'manager', 'administrator', 'admin', 'superuser'];
    const isManagerLevel = managerRoles.includes(userRole);
    
    if (evaluation.evaluatedById !== user.id && !isManagerLevel) {
      throw new BadRequestException('Only the evaluator or manager-level users can delete this evaluation');
    }

    await this.evaluationRepository.remove(evaluation);
  }
}
