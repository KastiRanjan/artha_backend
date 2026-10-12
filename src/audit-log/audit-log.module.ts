import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import * as auditOrmConfig from 'src/config/audit-ormconfig';
import { AuditLogService } from './audit-log.service';
import { AuditLogController } from './audit-log.controller';
import { AuditContextMiddleware } from './audit-context.middleware';
import { AuditLogSubscriber } from './audit-log.subscriber';

/**
 * AuditLogModule
 *
 * Registers the separate audit database connection and all audit
 * infrastructure:
 * - TypeORM connection to the audit database
 * - Entity subscriber for intercepting changes on the main database
 * - Middleware for capturing request context (user, IP)
 * - Controller and service for querying audit logs
 *
 * The subscriber is registered on the default (main) connection but
 * writes to the audit connection.
 */
import { APP_INTERCEPTOR } from '@nestjs/core';
import { AuditContextInterceptor } from './audit-context.interceptor';
import { isAuditLogEnabled } from './audit-log.config';

const auditEnabled = isAuditLogEnabled();

@Module({
  imports: auditEnabled
    ? [
        // Only register the audit database connection if enabled via env
        TypeOrmModule.forRootAsync({
          name: 'audit',
          useFactory: () => auditOrmConfig
        })
      ]
    : [],
  controllers: [AuditLogController],
  providers: [
    AuditLogService,
    ...(auditEnabled
      ? [
          AuditLogSubscriber,
          {
            provide: APP_INTERCEPTOR,
            useClass: AuditContextInterceptor
          }
        ]
      : [])
  ],
  exports: [AuditLogService]
})
export class AuditLogModule implements NestModule {
  /**
   * Apply the audit context middleware to all routes only if enabled.
   */
  configure(consumer: MiddlewareConsumer) {
    if (auditEnabled) {
      consumer.apply(AuditContextMiddleware).forRoutes('*');
    }
  }
}
