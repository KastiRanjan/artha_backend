import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BusinessNature } from './entities/business-nature.entity';
import { BusinessNatureService } from './business-nature.service';
import { BusinessNatureController } from './business-nature.controller';

@Module({
  imports: [TypeOrmModule.forFeature([BusinessNature])],
  controllers: [BusinessNatureController],
  providers: [BusinessNatureService],
  exports: [BusinessNatureService],
})
export class BusinessNatureModule {}
