import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WorkhourController } from './workhour.controller';
import { WorkhourService } from './workhour.service';
import { Workhour } from './entities/workhour.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Workhour])],
  controllers: [WorkhourController],
  providers: [WorkhourService],
  exports: [WorkhourService],
})
export class WorkhourModule {}
