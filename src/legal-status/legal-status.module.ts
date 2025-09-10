import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LegalStatusService } from './legal-status.service';
import { LegalStatusController } from './legal-status.controller';
import { LegalStatus } from './entities/legal-status.entity';

@Module({
  imports: [TypeOrmModule.forFeature([LegalStatus])],
  controllers: [LegalStatusController],
  providers: [LegalStatusService],
  exports: [LegalStatusService, TypeOrmModule]
})
export class LegalStatusModule {}
