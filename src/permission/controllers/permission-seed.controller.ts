import { Controller, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/common/guard/jwt-auth.guard';
import { PermissionGuard } from 'src/common/guard/permission.guard';
import { Permissions } from 'src/permission/decorators/permissions.decorator';
import { PermissionSeedService } from '../services/permission-seed.service';

@ApiTags('permissions')
@Controller('permissions/seed')
@UseGuards(JwtAuthGuard, PermissionGuard)
@ApiBearerAuth()
export class PermissionSeedController {
  constructor(private readonly permissionSeedService: PermissionSeedService) {}

  @Post()
  @Permissions('create:permission')
  async seedPermissions() {
    return this.permissionSeedService.seed();
  }
}
