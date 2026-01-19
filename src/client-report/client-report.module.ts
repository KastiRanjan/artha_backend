import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';

import { ClientReport } from './entities/client-report.entity';
import { ClientUser } from './entities/client-user.entity';
import { Customer } from 'src/customers/entities/customer.entity';
import { Project } from 'src/projects/entities/project.entity';
import { ClientReportService } from './client-report.service';
import { ClientUserService } from './client-user.service';
import { ClientReportController } from './client-report.controller';
import { ClientUserController } from './client-user.controller';
import { ClientPortalController } from './client-portal.controller';
import { ClientAuthGuard } from './guards/client-auth.guard';
import { MailModule } from 'src/mail/mail.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([ClientReport, ClientUser, Customer, Project]),
    JwtModule.registerAsync({
      useFactory: () => ({
        secret: process.env.JWT_SECRET || 'your-secret-key',
        signOptions: { expiresIn: '24h' }
      })
    }),
    MailModule
  ],
  controllers: [
    ClientReportController,
    ClientUserController,
    ClientPortalController
  ],
  providers: [
    ClientReportService,
    ClientUserService,
    ClientAuthGuard
  ],
  exports: [ClientReportService, ClientUserService, ClientAuthGuard]
})
export class ClientReportModule {}
