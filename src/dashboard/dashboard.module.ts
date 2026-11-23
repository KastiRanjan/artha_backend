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
import { Project } from 'src/projects/entities/project.entity';
import { Customer } from 'src/customers/entities/customer.entity';
import { Task } from 'src/tasks/entities/task.entity';
import { NoticeBoard } from 'src/notice-board/entities/notice-board.entity';
import { WorkingYear } from 'src/working-year/entities/working-year.entity';
import { ClientReport } from 'src/client-report/entities/client-report.entity';
import { ClientUser } from 'src/client-report/entities/client-user.entity';

@Module({
  controllers: [DashboardController],
  imports: [
    TypeOrmModule.forFeature([
      UserEntity,
      Attendance,
      Project,
      Customer,
      Task,
      NoticeBoard,
      WorkingYear,
      ClientReport,
      ClientUser,
    ]),
    AuthModule, 
    AttendenceModule,
    WorklogModule,
    WorkhourModule
  ],
  providers: [DashboardService]
})
export class DashboardModule {}
