import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProjectSignoffService } from './project-signoff.service';
import { ProjectSignoffController } from './project-signoff.controller';
import { ProjectSignoff } from './entities/project-signoff.entity';
import { Project } from 'src/projects/entities/project.entity';
import { ProjectEvaluation } from 'src/project-evaluation/entities/project-evaluation.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([ProjectSignoff, Project, ProjectEvaluation])
  ],
  controllers: [ProjectSignoffController],
  providers: [ProjectSignoffService],
  exports: [ProjectSignoffService]
})
export class ProjectSignoffModule {}
