import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Request, Response } from 'express';
import { AuditLogService } from './audit-log.service';
import { AuditContext } from './audit-context';

/**
 * AccessLogInterceptor
 *
 * Records server access records into the access_log table.
 * Specifically monitors execution duration to identify heavy operations (>= 1000ms)
 * that cause heavy database/server load or performance bottlenecks.
 */
@Injectable()
export class AccessLogInterceptor implements NestInterceptor {
  private readonly logger = new Logger('AccessLogInterceptor');
  private readonly HEAVY_OPERATION_THRESHOLD_MS = parseInt(
    process.env.HEAVY_OPERATION_THRESHOLD_MS || '2000',
    10,
  );

  constructor(private readonly auditLogService: AuditLogService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    if (context.getType() !== 'http') {
      return next.handle();
    }

    const http = context.switchToHttp();
    const req = http.getRequest<Request>();
    const res = http.getResponse<Response>();

    const startTime = Date.now();

    return next.handle().pipe(
      tap({
        next: () => {
          this.logAccessRecord(req, res, startTime);
        },
        error: (err) => {
          const status = err?.status || err?.statusCode || 500;
          this.logAccessRecord(req, res, startTime, status);
        },
      }),
    );
  }

  private logAccessRecord(
    req: Request,
    res: Response,
    startTime: number,
    overrideStatus?: number,
  ) {
    try {
      const endpoint = req.originalUrl || req.url || '';

      // Skip static swagger UI assets or favicon
      if (
        endpoint.startsWith('/api-docs/') ||
        endpoint === '/favicon.ico' ||
        endpoint.endsWith('.css') ||
        endpoint.endsWith('.js')
      ) {
        return;
      }

      const durationMs = Date.now() - startTime;
      const statusCode = overrideStatus || res.statusCode || 200;
      const isHeavy = durationMs >= this.HEAVY_OPERATION_THRESHOLD_MS;

      const user = (req as any)?.user;
      const userId = user?.id || user?.userId || AuditContext.getUserId() || null;
      const userName = user?.name || user?.username || AuditContext.getUserName() || null;
      const userEmail = user?.email || AuditContext.getUserEmail() || null;

      const ipAddress =
        AuditContext.getIpAddress() ||
        (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
        req.ip ||
        null;

      const userAgent =
        AuditContext.getUserAgent() || (req.headers['user-agent'] as string) || null;

      if (isHeavy) {
        this.logger.warn(
          `⚠️ [HEAVY OPERATION DETECTED] ${req.method} ${endpoint} took ${durationMs}ms (User: ${userName || userId || 'Anonymous'}, Status: ${statusCode})`,
        );
      }

      // Record access asynchronously
      this.auditLogService
        .logAccess({
          userId: userId ? String(userId).slice(0, 90) : null,
          userName: userName ? String(userName).slice(0, 190) : null,
          userEmail: userEmail ? String(userEmail).slice(0, 190) : null,
          ipAddress: ipAddress ? String(ipAddress).slice(0, 45) : null,
          userAgent: userAgent ? String(userAgent).slice(0, 950) : null,
          method: (req.method || 'GET').slice(0, 10),
          endpoint: endpoint.slice(0, 950),
          statusCode,
          durationMs,
          isHeavyOperation: isHeavy,
          requestQuery: req.query && Object.keys(req.query).length > 0 ? req.query : undefined,
          requestBody: req.body && Object.keys(req.body).length > 0 ? req.body : undefined,
          action: `${req.method} ${endpoint.split('?')[0]}`.slice(0, 480),
          description: isHeavy
            ? `Heavy server operation: ${durationMs}ms duration`
            : undefined,
        })
        .catch((e) => {
          this.logger.error(`Error saving access record: ${e.message}`);
        });
    } catch (err) {
      this.logger.error(`Error in AccessLogInterceptor: ${err.message}`);
    }
  }
}
