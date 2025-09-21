import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TaskTypeService } from './task-type.service';
import { TaskTypeController } from './task-type.controller';
import { TaskType } from './entities/task-type.entity';

@Module({
  imports: [TypeOrmModule.forFeature([TaskType])],
  controllers: [TaskTypeController],
  providers: [TaskTypeService],
  exports: [TaskTypeService],
})
export class TaskTypeModule {}