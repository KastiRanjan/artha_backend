import { Module } from '@nestjs/common';
import { TasksService } from './tasks.service';
import { TasksController } from './tasks.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Task } from './entities/task.entity';
import { UserEntity } from 'src/auth/entity/user.entity';
import { Project } from 'src/projects/entities/project.entity';
import { TaskGroup } from 'src/task-groups/entities/task-group.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Task, UserEntity, Project, TaskGroup])],
  controllers: [TasksController],
  providers: [TasksService]
})
export class TasksModule {}
