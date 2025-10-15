import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProjectEvaluationService } from './project-evaluation.service';
import { ProjectEvaluationController } from './project-evaluation.controller';
import { ProjectEvaluation } from './entities/project-evaluation.entity';
import { Project } from 'src/projects/entities/project.entity';
import { UserEntity } from 'src/auth/entity/user.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([ProjectEvaluation, Project, UserEntity])
  ],
  controllers: [ProjectEvaluationController],
  providers: [ProjectEvaluationService],
  exports: [ProjectEvaluationService]
})
export class ProjectEvaluationModule {}
