import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PermissionEntity } from 'src/permission/entities/permission.entity';
import { MethodList } from 'src/config/permission-config';
import { customModules } from 'src/config/permissions';
import { LoadPermissionMisc } from 'src/permission/misc/load-permission.misc';

@Injectable()
export class PermissionSeedService {
  constructor(
    @InjectRepository(PermissionEntity)
    private readonly permissionRepository: Repository<PermissionEntity>,
    private readonly loadPermissionMisc: LoadPermissionMisc,
  ) {}

  async seed() {
    // Get existing permissions
    const existingPermissions = await this.permissionRepository.find();

    // Process all custom modules to extract routes
    let permissionsList = [];

    for (const module of customModules) {
      permissionsList = this.loadPermissionMisc.assignResourceAndConcatPermission(
        module,
        permissionsList,
        module.resource,
      );
    }

    // Create new permissions for routes that don't exist yet
    for (const permission of permissionsList) {
      const existingPermission = existingPermissions.find(
        (p) =>
          p.path === permission.path &&
          p.method === permission.method &&
          p.resource === permission.resource,
      );

      if (!existingPermission) {
        await this.permissionRepository.save({
          path: permission.path,
          method: permission.method,
          resource: permission.resource,
          description: permission.description || `${permission.method} ${permission.path}`,
          isDefault: permission.isDefault || false,
        });
      }
    }

    return { message: 'Custom permissions seeded successfully' };
  }
}
