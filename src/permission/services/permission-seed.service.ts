import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MethodList, PermissionConfiguration } from 'src/config/permission-config';
import { PermissionRepository } from 'src/permission/permission.repository';
import { LoadPermissionMisc } from 'src/permission/misc/load-permission.misc';

@Injectable()
export class PermissionSeedService {
  constructor(
    @InjectRepository(PermissionRepository)
    private readonly permissionRepository: PermissionRepository,
    private readonly loadPermissionMisc: LoadPermissionMisc,
  ) {}

  async seed() {
    // Get existing permissions
    const existingPermissions = await this.permissionRepository.find();

    // Process all modules from the PermissionConfiguration to extract routes
    let permissionsList = [];

    // Process modules from the main configuration
    for (const module of PermissionConfiguration.modules) {
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
