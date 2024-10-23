import { Module } from '@nestjs/common';
import { AttendenceService } from './attendence.service';
import { AttendenceController } from './attendence.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Attendance } from './entities/attendence.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Attendance])],
  controllers: [AttendenceController],
  providers: [AttendenceService]
})
export class AttendenceModule {}
