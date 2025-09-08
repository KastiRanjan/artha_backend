import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BusinessSize } from './entities/business-size.entity';
import { BusinessSizeService } from './business-size.service';
import { BusinessSizeController } from './business-size.controller';

@Module({
  imports: [TypeOrmModule.forFeature([BusinessSize])],
  controllers: [BusinessSizeController],
  providers: [BusinessSizeService],
  exports: [BusinessSizeService],
})
export class BusinessSizeModule {}
