import { Module } from '@nestjs/common';
import { AttendenceService } from './attendence.service';
import { AttendenceController } from './attendence.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Attendance } from './entities/attendence.entity';
import { AttendanceHistory } from './entities/attendence-history.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Attendance, AttendanceHistory])],
  controllers: [AttendenceController],
  providers: [AttendenceService]
})
export class AttendenceModule {}
