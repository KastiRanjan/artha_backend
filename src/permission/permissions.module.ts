import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { PermissionsService } from 'src/permission/permissions.service';
import { PermissionsController } from 'src/permission/permissions.controller';
import { PermissionRepository } from 'src/permission/permission.repository';
import { UniqueValidatorPipe } from 'src/common/pipes/unique-validator.pipe';
import { AuthModule } from 'src/auth/auth.module';
import { PermissionSeedService } from './services/permission-seed.service';
import { PermissionSeedController } from './controllers/permission-seed.controller';
import { LoadPermissionMisc } from './misc/load-permission.misc';

@Module({
  imports: [TypeOrmModule.forFeature([PermissionRepository]), AuthModule],
  exports: [PermissionsService, PermissionSeedService],
  controllers: [PermissionsController, PermissionSeedController],
  providers: [PermissionsService, UniqueValidatorPipe, PermissionSeedService, LoadPermissionMisc]
})
export class PermissionsModule {}
