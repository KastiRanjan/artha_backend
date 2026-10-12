import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { AuditContext } from './audit-context';

/**
 * Middleware that captures the current user context from the JWT-authenticated
 * request and stores it in the static AuditContext for the audit subscriber to use.
 *
 * This must be applied AFTER the auth guard/passport middleware so that
 * `req.user` is populated.
 */
import * as jwt from 'jsonwebtoken';

@Injectable()
export class AuditContextMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction): void {
    const user = (req as any).user;
    let userId = user?.id || user?.userId || null;
    let userName = user?.name || user?.username || null;

    // Fallback: extract user from JWT cookie or Authorization header
    if (!userId) {
      try {
        const token =
          (req as any).cookies?.Authentication ||
          (req.headers.authorization?.startsWith('Bearer ')
            ? req.headers.authorization.slice(7)
            : null);

        if (token) {
          const decoded = jwt.decode(token) as any;
          if (decoded) {
            userId = decoded.subject || decoded.id || decoded.userId || null;
            userName = decoded.name || decoded.username || null;
          }
        }
      } catch (err) {
        // Silently continue if token cannot be decoded
      }
    }

    // Get the real IP (support for proxies/load balancers)
    const ipAddress =
      (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
      req.ip ||
      req.connection?.remoteAddress ||
      null;

    const userAgent = req.headers['user-agent'] || null;

    AuditContext.setContext(userId, userName, ipAddress, userAgent);

    // Clean up context after the response is sent
    res.on('finish', () => {
      AuditContext.clear();
    });

    next();
  }
}
