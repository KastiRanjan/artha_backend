import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClientReportDocumentType } from './entities/client-report-document-type.entity';
import { ClientReportDocumentTypeService } from './client-report-document-type.service';
import { ClientReportDocumentTypeController } from './client-report-document-type.controller';

@Module({
  imports: [TypeOrmModule.forFeature([ClientReportDocumentType])],
  controllers: [ClientReportDocumentTypeController],
  providers: [ClientReportDocumentTypeService],
  exports: [ClientReportDocumentTypeService, TypeOrmModule],
})
export class ClientReportDocumentTypeModule {}
