import { Module } from '@nestjs/common';
import { TaskTemplateService } from './task-template.service';
import { TaskTemplateController } from './task-template.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TaskTemplate } from './entities/task-template.entity';
import { TaskGroup } from 'src/task-groups/entities/task-group.entity';

@Module({
  imports: [TypeOrmModule.forFeature([TaskTemplate, TaskGroup])],
  controllers: [TaskTemplateController],
  providers: [TaskTemplateService]
})
export class TaskTemplateModule {}
