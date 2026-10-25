import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { AuditLogService } from './audit-log.service';
import { AuditContext } from './audit-context';

/**
 * AuditExceptionsFilter
 *
 * Catches unhandled exceptions across the application and persists
 * them into the error_log table in the audit database.
 * Preserves standard HTTP error responses to clients.
 */
@Catch()
export class AuditExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger('AuditExceptionsFilter');

  constructor(private readonly auditLogService: AuditLogService) {}

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    if (!response || typeof response.status !== 'function') {
      return;
    }

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const errorName =
      exception instanceof Error
        ? exception.name
        : (exception as any)?.constructor?.name || 'Error';

    let errorMessage = 'Internal server error';
    let errorResponsePayload: any = null;

    if (exception instanceof HttpException) {
      const res = exception.getResponse();
      if (typeof res === 'string') {
        errorMessage = res;
      } else if (typeof res === 'object' && res !== null) {
        errorMessage = (res as any).message || exception.message;
        errorResponsePayload = res;
      }
    } else if (exception instanceof Error) {
      errorMessage = exception.message;
    } else if (typeof exception === 'string') {
      errorMessage = exception;
    }

    const stackTrace = exception instanceof Error ? exception.stack : null;

    const user = (request as any)?.user;
    const userId = user?.id || user?.userId || AuditContext.getUserId() || null;
    const userName = user?.name || user?.username || AuditContext.getUserName() || null;
    const userEmail = user?.email || AuditContext.getUserEmail() || null;

    const ipAddress =
      AuditContext.getIpAddress() ||
      (request?.headers?.['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
      request?.ip ||
      null;

    const userAgent =
      AuditContext.getUserAgent() ||
      (request?.headers?.['user-agent'] as string) ||
      null;

    const endpoint = request?.originalUrl || request?.url || '';
    const method = request?.method || 'UNKNOWN';

    // Asynchronously log the error into error_log table
    this.auditLogService
      .logError({
        userId,
        userName,
        userEmail,
        ipAddress,
        userAgent,
        endpoint,
        method,
        statusCode: status,
        errorName,
        errorMessage: Array.isArray(errorMessage) ? errorMessage.join('; ') : String(errorMessage),
        stackTrace: stackTrace || undefined,
        requestPayload: request?.body,
        context: `${method} ${endpoint}`,
      })
      .catch((e) => {
        this.logger.error(`Failed to record error log in filter: ${e.message}`);
      });

    // Deliver HTTP response
    if (errorResponsePayload && typeof errorResponsePayload === 'object') {
      response.status(status).json(errorResponsePayload);
    } else {
      response.status(status).json({
        statusCode: status,
        message: errorMessage,
        error: errorName,
        timestamp: new Date().toISOString(),
        path: endpoint,
      });
    }
  }
}
