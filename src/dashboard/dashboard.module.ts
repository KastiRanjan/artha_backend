import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DashboardService } from 'src/dashboard/dashboard.service';
import { DashboardController } from 'src/dashboard/dashboard.controller';
import { AuthModule } from 'src/auth/auth.module';
import { AttendenceModule } from 'src/attendence/attendence.module';
import { WorklogModule } from 'src/worklog/worklog.module';
import { WorkhourModule } from 'src/workhour/workhour.module';
import { UserEntity } from 'src/auth/entity/user.entity';
import { Attendance } from 'src/attendence/entities/attendence.entity';

@Module({
  controllers: [DashboardController],
  imports: [
    TypeOrmModule.forFeature([UserEntity, Attendance]),
    AuthModule, 
    AttendenceModule,
    WorklogModule,
    WorkhourModule
  ],
  providers: [DashboardService]
})
export class DashboardModule {}
