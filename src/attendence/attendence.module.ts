import { Module } from '@nestjs/common';
import { AttendenceService } from './attendence.service';
import { AttendenceController } from './attendence.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Attendance } from './entities/attendence.entity';
import { AttendanceHistory } from './entities/attendence-history.entity';
import { UserEntity } from 'src/auth/entity/user.entity';
import { LeaveModule } from 'src/leave/leave.module';
import { HolidayModule } from 'src/holiday/holiday.module';
import { WorklogModule } from 'src/worklog/worklog.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Attendance, AttendanceHistory, UserEntity]),
    LeaveModule,
    HolidayModule,
    WorklogModule
  ],
  controllers: [AttendenceController],
  providers: [AttendenceService],
  exports: [AttendenceService]
})
export class AttendenceModule {}
