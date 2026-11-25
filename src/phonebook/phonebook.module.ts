import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserEntity } from 'src/auth/entity/user.entity';
import { Customer } from 'src/customers/entities/customer.entity';
import { ProjectUserAssignment } from 'src/projects/entities/project-user-assignment.entity';
import { Project } from 'src/projects/entities/project.entity';
import { RoleEntity } from 'src/role/entities/role.entity';
import { WorkingYearModule } from 'src/working-year/working-year.module';
import { PhonebookCategory } from './entities/phonebook-category.entity';
import { PhonebookEntry } from './entities/phonebook-entry.entity';
import { PhonebookHistory } from './entities/phonebook-history.entity';
import { PhonebookController } from './phonebook.controller';
import { PhonebookService } from './phonebook.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      PhonebookEntry,
      PhonebookCategory,
      PhonebookHistory,
      UserEntity,
      RoleEntity,
      Customer,
      Project,
      ProjectUserAssignment
    ]),
    WorkingYearModule
  ],
  controllers: [PhonebookController],
  providers: [PhonebookService],
  exports: [PhonebookService]
})
export class PhonebookModule {}
