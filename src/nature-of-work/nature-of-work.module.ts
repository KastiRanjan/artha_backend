import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NatureOfWork } from './entities/nature-of-work.entity';
import { NatureOfWorkService } from './nature-of-work.service';
import { NatureOfWorkController } from './nature-of-work.controller';

@Module({
  imports: [TypeOrmModule.forFeature([NatureOfWork])],
  controllers: [NatureOfWorkController],
  providers: [NatureOfWorkService],
  exports: [NatureOfWorkService],
})
export class NatureOfWorkModule {}
