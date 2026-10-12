import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { AuditContext } from './audit-context';

/**
 * Interceptor that updates AuditContext with the authenticated user
 * after AuthGuard / PermissionGuard has resolved and attached req.user.
 */
@Injectable()
export class AuditContextInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const req = context.switchToHttp().getRequest();
    if (req?.user) {
      const user = req.user;
      const userId = user.id || user.userId || null;
      const userName = user.name || user.username || null;
      if (userId) {
        AuditContext.updateUser(userId, userName);
      }
    }
    return next.handle();
  }
}
