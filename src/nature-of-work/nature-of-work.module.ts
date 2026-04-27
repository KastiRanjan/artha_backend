import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NatureOfWork } from './entities/nature-of-work.entity';
import { NatureOfWorkGroup } from './entities/nature-of-work-group.entity';
import { NatureOfWorkService } from './nature-of-work.service';
import { NatureOfWorkController } from './nature-of-work.controller';
import { Project } from 'src/projects/entities/project.entity';

@Module({
  imports: [TypeOrmModule.forFeature([NatureOfWork, NatureOfWorkGroup, Project])],
  controllers: [NatureOfWorkController],
  providers: [NatureOfWorkService],
  exports: [NatureOfWorkService],
})
export class NatureOfWorkModule {}
