import { Global, MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import * as auditOrmConfig from 'src/config/audit-ormconfig';
import { AuditLogService } from './audit-log.service';
import { AuditLogController } from './audit-log.controller';
import { AuditContextMiddleware } from './audit-context.middleware';
import { AuditLogSubscriber } from './audit-log.subscriber';
import { AuditContextInterceptor } from './audit-context.interceptor';
import { AccessLogInterceptor } from './access-log.interceptor';
import { AuditExceptionsFilter } from './audit-exceptions.filter';
import { isAuditLogEnabled } from './audit-log.config';

const auditEnabled = isAuditLogEnabled();

@Global()
@Module({
  imports: auditEnabled
    ? [
        TypeOrmModule.forRootAsync({
          name: 'audit',
          useFactory: () => auditOrmConfig,
        }),
      ]
    : [],
  controllers: [AuditLogController],
  providers: [
    AuditLogService,
    AccessLogInterceptor,
    AuditExceptionsFilter,
    {
      provide: APP_INTERCEPTOR,
      useClass: AccessLogInterceptor,
    },
    {
      provide: APP_FILTER,
      useClass: AuditExceptionsFilter,
    },
    ...(auditEnabled
      ? [
          AuditLogSubscriber,
          {
            provide: APP_INTERCEPTOR,
            useClass: AuditContextInterceptor,
          },
        ]
      : []),
  ],
  exports: [AuditLogService],
})
export class AuditLogModule implements NestModule {
  /**
   * Apply the audit context middleware to all routes.
   */
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(AuditContextMiddleware).forRoutes('*');
  }
}
