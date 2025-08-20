import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProjectTimeline } from './entities/project-timeline.entity';
import { Project } from './entities/project.entity';
import { UserEntity } from 'src/auth/entity/user.entity';

@Injectable()
export class ProjectTimelineService {
  constructor(
    @InjectRepository(ProjectTimeline)
    private timelineRepository: Repository<ProjectTimeline>,
    @InjectRepository(Project)
    private projectRepository: Repository<Project>,
    @InjectRepository(UserEntity)
    private userRepository: Repository<UserEntity>
  ) {}

  async log({ projectId, userId, action, details }: { projectId: string; userId?: string; action: string; details?: string; }) {
    const project = await this.projectRepository.findOne(projectId);
    const user = userId ? await this.userRepository.findOne(userId) : null;
    const timeline = this.timelineRepository.create({
      project,
      user,
      action,
      details: details || null
    });
    return this.timelineRepository.save(timeline);
  }

  async getTimeline(projectId: string) {
    return this.timelineRepository.find({
      where: { project: { id: projectId } },
      relations: ['user'],
      order: { createdAt: 'ASC' }
    });
  }
}
