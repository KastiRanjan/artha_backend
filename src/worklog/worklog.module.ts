import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserEntity } from 'src/auth/entity/user.entity';
import { Project } from 'src/projects/entities/project.entity';
import { Worklog } from './entities/worklog.entity';
import { WorklogController } from './worklog.controller';
import { WorklogService } from './worklog.service';

@Module({
  imports: [TypeOrmModule.forFeature([Worklog, UserEntity, Project])],
  controllers: [WorklogController],
  providers: [WorklogService]
})
export class WorklogModule {}
