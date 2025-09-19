import { Module } from '@nestjs/common';
import { TaskSuperService } from './task-super.service';
import { TaskSuperController } from './task-super.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TaskSuper } from './entities/task-super.entity';
import { TaskSuperProject } from './entities/task-super-project.entity';
import { Task } from '../tasks/entities/task.entity';
import { TaskTemplate } from '../task-template/entities/task-template.entity';
import { TaskGroupProject } from '../task-groups/entities/task-group-project.entity';
import { TaskGroup } from '../task-groups/entities/task-group.entity';
import { Project } from '../projects/entities/project.entity';

@Module({
  imports: [TypeOrmModule.forFeature([TaskSuper, TaskSuperProject, Task, TaskTemplate, TaskGroup, TaskGroupProject, Project])],
  controllers: [TaskSuperController],
  providers: [TaskSuperService],
  exports: [TaskSuperService],
})
export class TaskSuperModule {}