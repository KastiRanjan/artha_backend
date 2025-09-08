import { Module } from '@nestjs/common';
import { ProjectsController } from './projects.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Project } from './entities/project.entity';
import { ProjectTimeline } from './entities/project-timeline.entity';
import { ProjectTimelineService } from './project-timeline.service';
import { UserEntity } from 'src/auth/entity/user.entity';
import { NotificationService } from 'src/notification/notification.service';
import { Notification } from 'src/notification/entities/notification.entity';
import { ProjectsService } from './projects.service';
import { CustomersService } from 'src/customers/customers.service';
import { Customer } from 'src/customers/entities/customer.entity';
import { Billing } from 'src/billing/entities/billing.entity';
import { BillingService } from 'src/billing/billing.service';
import { NatureOfWork } from 'src/nature-of-work/entities/nature-of-work.entity';
import { NatureOfWorkService } from 'src/nature-of-work/nature-of-work.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Project, ProjectTimeline, UserEntity, Notification, Customer, Billing, NatureOfWork])
  ],
  controllers: [ProjectsController],
  providers: [ProjectsService, ProjectTimelineService, NotificationService, CustomersService, BillingService, NatureOfWorkService],
  exports: [ProjectsService, ProjectTimelineService]
})
export class ProjectsModule {}
