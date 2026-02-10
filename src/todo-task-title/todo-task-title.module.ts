import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TodoTaskTitleService } from './todo-task-title.service';
import { TodoTaskTitleController } from './todo-task-title.controller';
import { TodoTaskTitle } from './entities/todo-task-title.entity';

@Module({
  imports: [TypeOrmModule.forFeature([TodoTaskTitle])],
  controllers: [TodoTaskTitleController],
  providers: [TodoTaskTitleService],
  exports: [TodoTaskTitleService],
})
export class TodoTaskTitleModule {}
