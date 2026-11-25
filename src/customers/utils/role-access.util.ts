import { ForbiddenException } from '@nestjs/common';
import { UserEntity } from 'src/auth/entity/user.entity';

const ADMIN_ROLE_NAMES = new Set([
  'superuser',
  'super_user',
  'superadmin',
  'super admin',
  'administrator',
  'admin',
]);

export function isAdminOrSuperUser(user?: UserEntity | null): boolean {
  const roleName = (user?.role?.name || '').toLowerCase().trim();
  return ADMIN_ROLE_NAMES.has(roleName);
}

export function assertAdminOrSuperUser(user?: UserEntity | null): void {
  if (!isAdminOrSuperUser(user)) {
    throw new ForbiddenException(
      'Only Super Admin and Administrator can view or manage portal credentials'
    );
  }
}
