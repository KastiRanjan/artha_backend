import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProjectSignoff } from './entities/project-signoff.entity';
import { CreateProjectSignoffDto } from './dto/create-project-signoff.dto';
import { UpdateProjectSignoffDto } from './dto/update-project-signoff.dto';
import { Project } from 'src/projects/entities/project.entity';
import { UserEntity } from 'src/auth/entity/user.entity';
import { ProjectEvaluation } from 'src/project-evaluation/entities/project-evaluation.entity';

@Injectable()
export class ProjectSignoffService {
  constructor(
    @InjectRepository(ProjectSignoff)
    private signoffRepository: Repository<ProjectSignoff>,
    @InjectRepository(Project)
    private projectRepository: Repository<Project>,
    @InjectRepository(ProjectEvaluation)
    private evaluationRepository: Repository<ProjectEvaluation>,
  ) {}

  async create(
    createDto: CreateProjectSignoffDto,
    signedOffBy: UserEntity
  ): Promise<ProjectSignoff> {
    // Only project manager can sign off
    if (signedOffBy.role.name !== 'projectmanager') {
      throw new ForbiddenException('Only project manager can sign off projects');
    }

    // Verify project exists and is completed
    const project = await this.projectRepository.findOne({
      where: { id: createDto.projectId },
      relations: ['users', 'users.role', 'projectManager']
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    if (project.status !== 'completed') {
      throw new BadRequestException('Project must be completed before sign-off');
    }

    // Check if manager is assigned to this project
    if (project.projectManager?.id !== signedOffBy.id) {
      throw new ForbiddenException('Only the assigned project manager can sign off this project');
    }

    // Check if all evaluable team members have been evaluated
    // Protected roles (projectmanager, administrator, superuser) don't need evaluation
    const projectUsers = project.users || [];
    const protectedRoles = ['projectmanager', 'administrator', 'admin', 'superuser'];
    
    // Filter to only evaluable users (exclude protected roles)
    const evaluableUsers = projectUsers.filter(user => {
      const userRole = user?.role?.name?.toLowerCase();
      return !protectedRoles.includes(userRole);
    });

    const evaluations = await this.evaluationRepository.find({
      where: { projectId: project.id }
    });

    if (evaluations.length < evaluableUsers.length) {
      throw new BadRequestException(
        `All evaluable team members must be evaluated before sign-off. ${evaluations.length}/${evaluableUsers.length} completed (excluding project managers, administrators, and superusers)`
      );
    }

    // Check if sign-off already exists
    const existing = await this.signoffRepository.findOne({
      where: { projectId: createDto.projectId }
    });

    if (existing) {
      throw new BadRequestException('Sign-off already exists for this project');
    }

    const signoff = this.signoffRepository.create({
      ...createDto,
      signedOffBy,
      signedOffById: signedOffBy.id,
      signoffDate: new Date()
    });

    const savedSignoff = await this.signoffRepository.save(signoff);

    // Update project status to signed_off
    project.status = 'signed_off';
    await this.projectRepository.save(project);

    return savedSignoff;
  }

  async findAll(): Promise<ProjectSignoff[]> {
    return this.signoffRepository.find({
      relations: ['project', 'signedOffBy']
    });
  }

  async findByProject(projectId: string): Promise<ProjectSignoff> {
    const signoff = await this.signoffRepository.findOne({
      where: { projectId },
      relations: ['project', 'signedOffBy']
    });

    if (!signoff) {
      throw new NotFoundException('Sign-off not found for this project');
    }

    return signoff;
  }

  async findOne(id: string): Promise<ProjectSignoff> {
    const signoff = await this.signoffRepository.findOne({
      where: { id },
      relations: ['project', 'signedOffBy']
    });

    if (!signoff) {
      throw new NotFoundException('Sign-off not found');
    }

    return signoff;
  }

  async update(
    id: string,
    updateDto: UpdateProjectSignoffDto,
    user: UserEntity
  ): Promise<ProjectSignoff> {
    const signoff = await this.findOne(id);

    // Only the manager who signed off can update
    if (signoff.signedOffById !== user.id && user.role.name !== 'projectmanager') {
      throw new ForbiddenException('Only the signing manager can update this sign-off');
    }

    Object.assign(signoff, updateDto);
    return this.signoffRepository.save(signoff);
  }

  async remove(id: string, user: UserEntity): Promise<void> {
    const signoff = await this.findOne(id);

    // Only manager can delete
    if (user.role.name !== 'projectmanager') {
      throw new ForbiddenException('Only project manager can delete sign-off');
    }

    // Revert project status back to completed
    const project = await this.projectRepository.findOne({
      where: { id: signoff.projectId }
    });

    if (project) {
      project.status = 'completed';
      await this.projectRepository.save(project);
    }

    await this.signoffRepository.remove(signoff);
  }
}
