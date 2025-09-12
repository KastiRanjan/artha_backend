import { Module } from '@nestjs/common';
import { TaskGroupsService } from './task-groups.service';
import { TaskGroupsController } from './task-groups.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TaskGroup } from './entities/task-group.entity';
import { Task } from 'src/tasks/entities/task.entity';
import { TaskTemplate } from 'src/task-template/entities/task-template.entity';

@Module({
  imports: [TypeOrmModule.forFeature([TaskGroup, Task, TaskTemplate])],
  controllers: [TaskGroupsController],
  providers: [TaskGroupsService]
})
export class TaskGroupsModule {}
