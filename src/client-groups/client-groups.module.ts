import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClientGroup } from './entities/client-group.entity';
import { GroupContact } from './entities/group-contact.entity';
import { Customer } from 'src/customers/entities/customer.entity';
import { Project } from 'src/projects/entities/project.entity';
import { UserEntity } from 'src/auth/entity/user.entity';
import { ClientGroupsService } from './client-groups.service';
import { ClientGroupsController } from './client-groups.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ClientGroup,
      GroupContact,
      Customer,
      Project,
      UserEntity
    ])
  ],
  controllers: [ClientGroupsController],
  providers: [ClientGroupsService],
  exports: [ClientGroupsService]
})
export class ClientGroupsModule {}
