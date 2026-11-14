import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WorkingYear } from './entities/working-year.entity';
import { WorkingYearConfig } from './entities/working-year-config.entity';
import { WorkingYearService } from './working-year.service';
import { WorkingYearController } from './working-year.controller';
import { Project } from 'src/projects/entities/project.entity';
import { Worklog } from 'src/worklog/entities/worklog.entity';
import { Task } from 'src/tasks/entities/task.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      WorkingYear,
      WorkingYearConfig,
      Project,
      Worklog,
      Task,
    ])
  ],
  controllers: [WorkingYearController],
  providers: [WorkingYearService],
  exports: [WorkingYearService]
})
export class WorkingYearModule {}
