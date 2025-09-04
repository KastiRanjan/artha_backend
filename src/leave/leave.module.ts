import { Module } from '@nestjs/common';

import { LeaveController } from './leave.controller';
import { LeaveService } from './leave.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Leave } from './entities/leave.entity';
import { LeaveType } from '../leave-type/entities/leave-type.entity';
import { Project } from '../projects/entities/project.entity';
import { Holiday } from '../holiday/entities/holiday.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Leave, LeaveType, Project, Holiday])],
  controllers: [LeaveController],
  providers: [LeaveService],
  exports: [LeaveService],
})
export class LeaveModule {}
