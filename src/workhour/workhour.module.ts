import { Module } from '@nestjs/common';
import { WorkhourController } from './workhour.controller';
import { WorkhourService } from './workhour.service';

@Module({
  controllers: [WorkhourController],
  providers: [WorkhourService],
})
export class WorkhourModule {}
