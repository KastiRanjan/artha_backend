import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserEntity } from 'src/auth/entity/user.entity';
import { Project } from 'src/projects/entities/project.entity';
import { Worklog } from './entities/worklog.entity';
import { WorklogController } from './worklog.controller';
import { WorklogService } from './worklog.service';
import { Task } from 'src/tasks/entities/task.entity';
import { Notification } from 'src/notification/entities/notification.entity';
import { NotificationService } from 'src/notification/notification.service';

@Module({
  imports: [TypeOrmModule.forFeature([Worklog, UserEntity, Project, Task,Notification])],
  controllers: [WorklogController],
  providers: [WorklogService,NotificationService]
})
export class WorklogModule {}
