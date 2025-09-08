import { Module } from '@nestjs/common';
import { CustomersService } from './customers.service';
import { CustomersController } from './customers.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Customer } from './entities/customer.entity';
import { RegistrationAndLicense } from './entities/registration-and-license.entity';
import { BoardMember } from './entities/board-member.entity';
import { ManagementTeamMember } from './entities/management-team-member.entity';
import { OtherImportantInfo } from './entities/other-important-info.entity';
import { BusinessSize } from 'src/business-size/entities/business-size.entity';
import { BusinessNature } from 'src/business-nature/entities/business-nature.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Customer,
      RegistrationAndLicense,
      BoardMember,
      ManagementTeamMember,
      OtherImportantInfo,
      BusinessSize,
      BusinessNature,
    ])
  ],
  controllers: [CustomersController],
  providers: [CustomersService]
})
export class CustomersModule {}
