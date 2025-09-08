import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import {
  PermissionConfiguration,
  RoutePayloadInterface
} from 'src/config/permission-config';
import { UserEntity } from 'src/auth/entity/user.entity';
import { PERMISSIONS_KEY } from 'src/permission/decorators/permissions.decorator';

@Injectable()
export class PermissionGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  /**
   * check if user authorized
   * @param context
   */
  canActivate(
    context: ExecutionContext
  ): boolean | Promise<boolean> | Observable<boolean> {
    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(
      PERMISSIONS_KEY,
      [
        context.getHandler(),
        context.getClass(),
      ],
    );
    
    if (!requiredPermissions) {
      // If no specific permissions are required, fall back to route-based check
      const request = context.switchToHttp().getRequest();
      const path = request.route.path;
      const method = request.method.toLowerCase();
      const permissionPayload: RoutePayloadInterface = {
        path,
        method
      };
      const permitted = this.checkIfDefaultRoute(permissionPayload);
      if (permitted) {
        return true;
      }
      return this.checkIfUserHavePermission(request.user, permissionPayload);
    }

    const { user } = context.switchToHttp().getRequest();
    return this.matchPermissions(requiredPermissions, user);
  }

  /**
   * Match user permissions with required permissions
   */
  private matchPermissions(permissions: string[], user: UserEntity): boolean {
    if (!user || !user.role || !user.role.permission) {
      return false;
    }

    // Map user permissions to format strings (e.g., 'create:permission')
    const userPermissions = user.role.permission.map(
      p => `${p.method}:${p.resource}`
    );

    return permissions.some(permission => userPermissions.includes(permission));
  }

  /**
   * check if route is default
   * @param permissionAgainst
   */
  checkIfDefaultRoute(permissionAgainst: RoutePayloadInterface) {
    const { path, method } = permissionAgainst;
    const defaultRoutes = PermissionConfiguration.defaultRoutes;
    return defaultRoutes.some(
      (route) => route.path === path && route.method === method
    );
  }

  /**
   * check if user have necessary permission to view resource
   * @param user
   * @param permissionAgainst
   */
  checkIfUserHavePermission(
    user: UserEntity,
    permissionAgainst: RoutePayloadInterface
  ) {
    const { path, method } = permissionAgainst;
    if (user && user.role && user.role.permission) {
      return user.role.permission.some(
        (route) => route.path === path && route.method === method
      );
    }
    return false;
  }
}
