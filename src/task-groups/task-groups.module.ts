import { Module } from '@nestjs/common';
import { TaskGroupsService } from './task-groups.service';
import { TaskGroupsController } from './task-groups.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TaskGroup } from './entities/task-group.entity';
import { TaskGroupProject } from './entities/task-group-project.entity';
import { Task } from 'src/tasks/entities/task.entity';
import { TaskTemplate } from 'src/task-template/entities/task-template.entity';
import { TaskSuper } from 'src/task-super/entities/task-super.entity';
import { TaskSuperProject } from 'src/task-super/entities/task-super-project.entity';

@Module({
  imports: [TypeOrmModule.forFeature([TaskGroup, TaskGroupProject, Task, TaskTemplate, TaskSuper, TaskSuperProject])],
  controllers: [TaskGroupsController],
  providers: [TaskGroupsService]
})
export class TaskGroupsModule {}
