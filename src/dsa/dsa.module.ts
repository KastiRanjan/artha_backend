import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DsaService } from './dsa.service';
import { DsaController } from './dsa.controller';
import { Dsa } from './entities/dsa.entity';
import { Project } from 'src/projects/entities/project.entity';
import { AuthModule } from 'src/auth/auth.module';
import { NotificationModule } from 'src/notification/notification.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Dsa, Project]),
    AuthModule,
    NotificationModule
  ],
  controllers: [DsaController],
  providers: [DsaService],
})
export class DsaModule {}
