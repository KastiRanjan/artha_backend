import { Module } from '@nestjs/common';
import { TasksService } from './tasks.service';
import { TasksController } from './tasks.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Task } from './entities/task.entity';
import { UserEntity } from 'src/auth/entity/user.entity';
import { Project } from 'src/projects/entities/project.entity';
import { TaskGroup } from 'src/task-groups/entities/task-group.entity';
import { TaskGroupProject } from 'src/task-groups/entities/task-group-project.entity';
import { TaskSuper } from 'src/task-super/entities/task-super.entity';
import { TaskSuperProject } from 'src/task-super/entities/task-super-project.entity';
import { Worklog } from 'src/worklog/entities/worklog.entity';
import { ProjectsModule } from 'src/projects/projects.module';
import { TaskRankingService } from './task-ranking.service';
import { TaskRankingController } from './task-ranking.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([Task, UserEntity, Project, TaskGroup, TaskGroupProject, TaskSuper, TaskSuperProject, Worklog]),
    ProjectsModule
  ],
  controllers: [TasksController, TaskRankingController],
  providers: [TasksService, TaskRankingService]
})
export class TasksModule {}
