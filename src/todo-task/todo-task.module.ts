import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TodoTaskService } from './todo-task.service';
import { TodoTaskController } from './todo-task.controller';
import { TodoTask } from './entities/todo-task.entity';
import { UserEntity } from 'src/auth/entity/user.entity';
import { TaskTypeModule } from 'src/task-type/task-type.module';
import { TodoTaskTitleModule } from 'src/todo-task-title/todo-task-title.module';
import { NotificationModule } from 'src/notification/notification.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([TodoTask, UserEntity]),
    TaskTypeModule,
    TodoTaskTitleModule,
    NotificationModule
  ],
  controllers: [TodoTaskController],
  providers: [TodoTaskService],
  exports: [TodoTaskService],
})
export class TodoTaskModule {}