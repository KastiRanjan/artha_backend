import { Module } from '@nestjs/common';

import { LeaveController } from './leave.controller';
import { LeaveService } from './leave.service';
import { UserLeaveBalanceService } from './user-leave-balance.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Leave } from './entities/leave.entity';
import { UserLeaveBalance } from './entities/user-leave-balance.entity';
import { LeaveType } from '../leave-type/entities/leave-type.entity';
import { Project } from '../projects/entities/project.entity';
import { Holiday } from '../holiday/entities/holiday.entity';
import { NotificationModule } from '../notification/notification.module';
import { NotificationService } from '../notification/notification.service';
import { Notification } from '../notification/entities/notification.entity';
import { UserEntity } from '../auth/entity/user.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Leave, UserLeaveBalance, LeaveType, Project, Holiday, Notification, UserEntity]),
    NotificationModule
  ],
  controllers: [LeaveController],
  providers: [LeaveService, UserLeaveBalanceService, NotificationService],
  exports: [LeaveService, UserLeaveBalanceService],
})
export class LeaveModule {}
