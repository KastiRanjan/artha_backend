import { Module } from '@nestjs/common';  
import { HolidayController } from './holiday.controller';  
import { HolidayService } from './holiday.service';  
import { TypeOrmModule } from '@nestjs/typeorm';  
import { Holiday } from './entities/holiday.entity';  
  
@Module({  
  imports: [TypeOrmModule.forFeature([Holiday])],  
  controllers: [HolidayController],  
  providers: [HolidayService],  
  exports: [HolidayService],  
})  
export class HolidayModule {} 
