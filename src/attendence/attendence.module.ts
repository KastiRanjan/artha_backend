import { Module } from '@nestjs/common';
import { AttendenceService } from './attendence.service';
import { AttendenceController } from './attendence.controller';
import { AttendanceSchedulerService } from './attendance-scheduler.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Attendance } from './entities/attendence.entity';
import { AttendanceHistory } from './entities/attendence-history.entity';
import { AttendanceReminderLog } from './entities/attendance-reminder-log.entity';
import { UserEntity } from 'src/auth/entity/user.entity';
import { LeaveModule } from 'src/leave/leave.module';
import { HolidayModule } from 'src/holiday/holiday.module';
import { WorklogModule } from 'src/worklog/worklog.module';
import { WorkhourModule } from 'src/workhour/workhour.module';
import { MailModule } from 'src/mail/mail.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Attendance, AttendanceHistory, AttendanceReminderLog, UserEntity]),
    LeaveModule,
    HolidayModule,
    WorklogModule,
    WorkhourModule,
    MailModule
  ],
  controllers: [AttendenceController],
  providers: [AttendenceService, AttendanceSchedulerService],
  exports: [AttendenceService]
})
export class AttendenceModule {}
