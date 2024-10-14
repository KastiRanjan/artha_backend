import { Module } from '@nestjs/common';
import { TaskGroupsService } from './task-groups.service';
import { TaskGroupsController } from './task-groups.controller';

@Module({
  controllers: [TaskGroupsController],
  providers: [TaskGroupsService]
})
export class TaskGroupsModule {}
