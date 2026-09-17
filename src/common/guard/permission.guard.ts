import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import {
  PermissionConfiguration,
  RoutePayloadInterface
} from 'src/config/permission-config';
import { UserEntity } from 'src/auth/entity/user.entity';
import { PERMISSIONS_KEY } from 'src/permission/decorators/permissions.decorator';
import { IS_PUBLIC_KEY } from 'src/common/decorators/public.decorator';
import JwtTwoFactorGuard from 'src/common/guard/jwt-two-factor.guard';

@Injectable()
export class PermissionGuard implements CanActivate {
  private jwtGuard = new JwtTwoFactorGuard();

  constructor(private reflector: Reflector) {}

  /**
   * Check if user is authorized for the current request
   */
  async canActivate(context: ExecutionContext): Promise<boolean> {
    // 1. Check if route or controller is marked with @Public()
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass()
    ]);
    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const url = request.url || request.originalUrl || '';
    const cleanUrl = url.split('?')[0];

    // 2. Allow Swagger, static docs, static files, and client portal without interference
    if (
      cleanUrl.startsWith('/api-docs') ||
      cleanUrl.startsWith('/public') ||
      cleanUrl.startsWith('/socket.io') ||
      cleanUrl.startsWith('/document/client-reports') ||
      cleanUrl.startsWith('/client-portal') ||
      cleanUrl === '/favicon.ico'
    ) {
      return true;
    }

    // 3. Resolve route path and method
    const routePath = request.route?.path;
    const method = request.method?.toLowerCase();

    // If no route path is available (e.g. 404 or unhandled path), allow standard handler to proceed
    if (!routePath || !method) {
      return true;
    }

    const permissionPayload: RoutePayloadInterface = {
      path: routePath,
      method: method as any
    };

    // 4. Check if route is in PublicRoutes (no auth needed, e.g. /auth/login, /check)
    if (this.checkIfPublicRoute(permissionPayload)) {
      return true;
    }

    // 5. Ensure user is authenticated. If not yet set, attempt JWT authentication
    if (!request.user) {
      try {
        const canAuth = await this.jwtGuard.canActivate(context);
        if (!canAuth) {
          return false;
        }
      } catch (error) {
        return false;
      }
    }

    const user: UserEntity = request.user;
    if (!user) {
      return false;
    }

    // 6. Check if route is an Authenticated Default Route (self-service profile, attendance, worklogs, my tasks, etc.)
    if (this.checkIfAuthenticatedDefaultRoute(permissionPayload)) {
      return true;
    }

    if (!user.role) {
      return false;
    }

    // 7. Superuser role has unrestricted access to all endpoints
    if (user.role.name === 'superuser') {
      return true;
    }

    // 8. Check specific permissions decorator (@Permissions(...))
    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()]
    );

    if (requiredPermissions && requiredPermissions.length > 0) {
      return this.matchPermissions(requiredPermissions, user);
    }

    // 9. Route-based permission check
    return this.checkIfUserHavePermission(user, permissionPayload);
  }

  /**
   * Match user permissions with required permissions (@Permissions decorator)
   */
  private matchPermissions(permissions: string[], user: UserEntity): boolean {
    if (!user || !user.role || !user.role.permission) {
      return false;
    }

    const methodResourcePerms = user.role.permission.map(
      (p) => `${p.method?.toLowerCase()}:${p.resource?.toLowerCase()}`
    );
    const descPerms = user.role.permission.map((p) =>
      p.description?.toLowerCase()
    );

    return permissions.some((permission) => {
      const pLower = permission.toLowerCase();
      return methodResourcePerms.includes(pLower) || descPerms.includes(pLower);
    });
  }

  /**
   * Check if route is public (accessible without login)
   */
  checkIfPublicRoute(permissionAgainst: RoutePayloadInterface): boolean {
    const { path, method } = permissionAgainst;
    const publicRoutes = PermissionConfiguration.publicRoutes || [];
    return publicRoutes.some(
      (route) =>
        route.path === path &&
        route.method?.toLowerCase() === method?.toLowerCase()
    );
  }

  /**
   * Check if route is an authenticated baseline/self-service route
   */
  checkIfAuthenticatedDefaultRoute(permissionAgainst: RoutePayloadInterface): boolean {
    const { path, method } = permissionAgainst;
    const authDefaults = PermissionConfiguration.authenticatedDefaultRoutes || [];
    return authDefaults.some(
      (route) =>
        route.path === path &&
        route.method?.toLowerCase() === method?.toLowerCase()
    );
  }

  /**
   * Check if route is default/unrestricted (legacy backward compatibility)
   */
  checkIfDefaultRoute(permissionAgainst: RoutePayloadInterface): boolean {
    const { path, method } = permissionAgainst;
    const defaultRoutes = PermissionConfiguration.defaultRoutes || [];
    return defaultRoutes.some(
      (route) =>
        route.path === path &&
        route.method?.toLowerCase() === method?.toLowerCase()
    );
  }

  /**
   * Check if user has necessary permission to access resource
   */
  checkIfUserHavePermission(
    user: UserEntity,
    permissionAgainst: RoutePayloadInterface
  ): boolean {
    const { path, method } = permissionAgainst;
    if (user && user.role && user.role.permission) {
      return user.role.permission.some(
        (route) =>
          route.path === path &&
          route.method?.toLowerCase() === method?.toLowerCase()
      );
    }
    return false;
  }
}
