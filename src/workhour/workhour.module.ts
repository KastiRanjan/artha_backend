import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WorkhourController } from './workhour.controller';
import { WorkhourService } from './workhour.service';
import { Workhour } from './entities/workhour.entity';
import { WorkhourHistory } from './entities/workhour-history.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Workhour, WorkhourHistory])],
  controllers: [WorkhourController],
  providers: [WorkhourService],
  exports: [WorkhourService],
})
export class WorkhourModule {}
