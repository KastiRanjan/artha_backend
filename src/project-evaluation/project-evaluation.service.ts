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
    const isProjectManager = evaluatorRole === 'projectmanager' || evaluatorRole === 'manager';
    
    // Don't allow evaluation of manager, administrator, or superuser roles
    const evaluatedUserRole = evaluatedUser.role.name.toLowerCase();
    const protectedRoles = ['projectmanager', 'manager', 'administrator', 'admin', 'superuser'];
    if (protectedRoles.includes(evaluatedUserRole)) {
      throw new BadRequestException('Cannot evaluate users with manager, administrator, or superuser roles');
    }

    // Role-based evaluation authorization
    // Project lead can evaluate audit senior and audit junior only
    if (isProjectLead && !isProjectManager) {
      const allowedRoles = ['auditsenior', 'auditjunior'];
      if (!allowedRoles.includes(evaluatedUserRole)) {
        throw new BadRequestException('Project lead can only evaluate audit senior and audit junior members');
      }
    }

    // Manager can evaluate all team members (already passed the protected roles check)
    if (!isProjectLead && !isProjectManager) {
      throw new BadRequestException('Only project lead or project manager can evaluate team members');
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

    // Only the evaluator or manager can update
    if (evaluation.evaluatedById !== user.id && user.role.name !== 'projectmanager') {
      throw new BadRequestException('Only the evaluator or manager can update this evaluation');
    }

    Object.assign(evaluation, updateDto);
    return this.evaluationRepository.save(evaluation);
  }

  async remove(id: string, user: UserEntity): Promise<void> {
    const evaluation = await this.findOne(id);

    // Only the evaluator or manager can delete
    if (evaluation.evaluatedById !== user.id && user.role.name !== 'projectmanager') {
      throw new BadRequestException('Only the evaluator or manager can delete this evaluation');
    }

    await this.evaluationRepository.remove(evaluation);
  }
}
