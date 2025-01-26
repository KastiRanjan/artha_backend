import { Module } from '@nestjs/common';
import { ProjectsController } from './projects.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Project } from './entities/project.entity';
import { UserEntity } from 'src/auth/entity/user.entity';
import { NotificationService } from 'src/notification/notification.service';
import { Notification } from 'src/notification/entities/notification.entity';
import { ProjectsService } from './projects.service';
import { CustomersService } from 'src/customers/customers.service';
import { Customer } from 'src/customers/entities/customer.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Project, UserEntity, Notification, Customer])
  ], // Add the missing entity to the imports
  controllers: [ProjectsController],
  providers: [ProjectsService, NotificationService, CustomersService]
})
export class ProjectsModule {}
