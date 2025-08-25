import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserEntity } from 'src/auth/entity/user.entity';
import { Project } from 'src/projects/entities/project.entity';
import { Worklog } from './entities/worklog.entity';
import { Leave } from 'src/leave/entities/leave.entity';
import { Holiday } from 'src/holiday/entities/holiday.entity';
import { WorklogController } from './worklog.controller';
import { WorklogService } from './worklog.service';
import { Task } from 'src/tasks/entities/task.entity';
import { Notification } from 'src/notification/entities/notification.entity';
import { NotificationService } from 'src/notification/notification.service';

import { ProjectsModule } from 'src/projects/projects.module';
import { LeaveService } from 'src/leave/leave.service';
import { HolidayService } from 'src/holiday/holiday.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Worklog, UserEntity, Project, Task, Notification, Leave, Holiday]),
    ProjectsModule
  ],
  controllers: [WorklogController],
  providers: [WorklogService, NotificationService, LeaveService, HolidayService]
})
export class WorklogModule {}
