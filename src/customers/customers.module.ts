import { Module } from '@nestjs/common';
import { CustomersService } from './customers.service';
import { CustomersController } from './customers.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Customer } from './entities/customer.entity';
import { RegistrationAndLicense } from './entities/registration-and-license.entity';
import { BoardMember } from './entities/board-member.entity';
import { ManagementTeamMember } from './entities/management-team-member.entity';
import { OtherImportantInfo } from './entities/other-important-info.entity';
import { PortalCredential } from './entities/portal-credential.entity';
import { BusinessSize } from 'src/business-size/entities/business-size.entity';
import { BusinessNature } from 'src/business-nature/entities/business-nature.entity';
import { LegalStatus } from 'src/legal-status/entities/legal-status.entity';
import { BusinessSizeModule } from 'src/business-size/business-size.module';
import { BusinessNatureModule } from 'src/business-nature/business-nature.module';
import { LegalStatusModule } from 'src/legal-status/legal-status.module';
import { PortalCredentialsService } from './portal-credentials.service';
import { PortalCredentialsController } from './portal-credentials.controller';
import { StandalonePortalCredentialsController } from './standalone-portal-credentials.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Customer,
      RegistrationAndLicense,
      BoardMember,
      ManagementTeamMember,
      OtherImportantInfo,
      PortalCredential,
      BusinessSize,
      BusinessNature,
      LegalStatus,
    ]),
    BusinessSizeModule,
    BusinessNatureModule,
    LegalStatusModule
  ],
  controllers: [CustomersController, PortalCredentialsController, StandalonePortalCredentialsController],
  providers: [CustomersService, PortalCredentialsService],
  exports: [CustomersService, PortalCredentialsService]
})
export class CustomersModule {}
