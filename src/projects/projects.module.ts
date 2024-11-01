import { Module } from '@nestjs/common';
import { ProjectsService } from './projects.service';
import { ProjectsController } from './projects.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Project } from './entities/project.entity';
import { UserEntity } from 'src/auth/entity/user.entity';
import { NotificationService } from 'src/notification/notification.service';
import { Notification } from 'src/notification/entities/notification.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Project, UserEntity, Notification])],
  controllers: [ProjectsController],
  providers: [ProjectsService, NotificationService]
})
export class ProjectsModule { }
