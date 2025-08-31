import { Module } from '@nestjs/common';

import { LeaveController } from './leave.controller';
import { LeaveService } from './leave.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Leave } from './entities/leave.entity';
import { LeaveType } from '../leave-type/entities/leave-type.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Leave, LeaveType])],
  controllers: [LeaveController],
  providers: [LeaveService],
  exports: [LeaveService],
})
export class LeaveModule {}
