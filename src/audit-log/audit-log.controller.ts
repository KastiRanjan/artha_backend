import {
  Controller,
  Get,
  Param,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import {
  AuditLogService,
  AuditLogQueryOptions,
  AccessLogQueryOptions,
  ErrorLogQueryOptions,
} from './audit-log.service';
import { AuditAction } from './entities/audit-log.model';

@ApiTags('Audit Logs')
@ApiBearerAuth()
@Controller('audit-logs')
export class AuditLogController {
  constructor(private readonly auditLogService: AuditLogService) {}

  @Get()
  @ApiOperation({ summary: 'Query entity audit logs with filtering and pagination' })
  @ApiQuery({ name: 'tableName', required: false, description: 'Filter by table name' })
  @ApiQuery({ name: 'entityId', required: false, description: 'Filter by entity ID' })
  @ApiQuery({ name: 'action', required: false, enum: AuditAction, description: 'Filter by action type' })
  @ApiQuery({ name: 'performedBy', required: false, description: 'Filter by user ID' })
  @ApiQuery({ name: 'fromDate', required: false, description: 'Filter from date (ISO string)' })
  @ApiQuery({ name: 'toDate', required: false, description: 'Filter to date (ISO string)' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number (default: 1)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page (default: 50)' })
  async findAll(
    @Query('tableName') tableName?: string,
    @Query('entityId') entityId?: string,
    @Query('action') action?: AuditAction,
    @Query('performedBy') performedBy?: string,
    @Query('fromDate') fromDate?: string,
    @Query('toDate') toDate?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const options: AuditLogQueryOptions = {
      tableName,
      entityId,
      action,
      performedBy,
      fromDate: fromDate ? new Date(fromDate) : undefined,
      toDate: toDate ? new Date(toDate) : undefined,
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 50,
    };

    return this.auditLogService.findAll(options);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get audit log statistics' })
  @ApiQuery({ name: 'fromDate', required: false, description: 'Stats from date (ISO string)' })
  @ApiQuery({ name: 'toDate', required: false, description: 'Stats to date (ISO string)' })
  async getStats(
    @Query('fromDate') fromDate?: string,
    @Query('toDate') toDate?: string,
  ) {
    return this.auditLogService.getStats(
      fromDate ? new Date(fromDate) : undefined,
      toDate ? new Date(toDate) : undefined,
    );
  }

  @Get('access')
  @ApiOperation({ summary: 'Query server access logs (requests, user, endpoint, timing)' })
  @ApiQuery({ name: 'userId', required: false, description: 'Filter by user ID' })
  @ApiQuery({ name: 'endpoint', required: false, description: 'Filter by endpoint path (partial)' })
  @ApiQuery({ name: 'method', required: false, description: 'Filter by HTTP method (GET, POST, etc.)' })
  @ApiQuery({ name: 'isHeavyOperation', required: false, type: Boolean, description: 'Filter by heavy operation' })
  @ApiQuery({ name: 'minDurationMs', required: false, type: Number, description: 'Filter by minimum duration in ms' })
  @ApiQuery({ name: 'fromDate', required: false, description: 'Filter from date (ISO string)' })
  @ApiQuery({ name: 'toDate', required: false, description: 'Filter to date (ISO string)' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number (default: 1)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page (default: 50)' })
  async findAccessLogs(
    @Query('userId') userId?: string,
    @Query('endpoint') endpoint?: string,
    @Query('method') method?: string,
    @Query('isHeavyOperation') isHeavyOperation?: string,
    @Query('minDurationMs') minDurationMs?: string,
    @Query('fromDate') fromDate?: string,
    @Query('toDate') toDate?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const options: AccessLogQueryOptions = {
      userId,
      endpoint,
      method,
      isHeavyOperation:
        isHeavyOperation !== undefined ? isHeavyOperation === 'true' : undefined,
      minDurationMs: minDurationMs ? parseInt(minDurationMs, 10) : undefined,
      fromDate: fromDate ? new Date(fromDate) : undefined,
      toDate: toDate ? new Date(toDate) : undefined,
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 50,
    };

    return this.auditLogService.findAccessLogs(options);
  }

  @Get('access/stats')
  @ApiOperation({ summary: 'Get access log statistics (total requests, heavy operations, slow endpoints)' })
  @ApiQuery({ name: 'fromDate', required: false, description: 'Filter from date' })
  @ApiQuery({ name: 'toDate', required: false, description: 'Filter to date' })
  async getAccessStats(
    @Query('fromDate') fromDate?: string,
    @Query('toDate') toDate?: string,
  ) {
    return this.auditLogService.getAccessStats(
      fromDate ? new Date(fromDate) : undefined,
      toDate ? new Date(toDate) : undefined,
    );
  }

  @Get('heavy-operations')
  @ApiOperation({ summary: 'Query slow and heavy operations causing load on database/server' })
  @ApiQuery({ name: 'minDurationMs', required: false, type: Number, description: 'Minimum duration in ms (default: 1000)' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number (default: 1)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page (default: 50)' })
  async findHeavyOperations(
    @Query('minDurationMs') minDurationMs?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.auditLogService.findHeavyOperations({
      minDurationMs: minDurationMs ? parseInt(minDurationMs, 10) : 1000,
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 50,
    });
  }

  @Get('errors')
  @ApiOperation({ summary: 'Query application error logs with stack traces and request context' })
  @ApiQuery({ name: 'userId', required: false, description: 'Filter by user ID' })
  @ApiQuery({ name: 'endpoint', required: false, description: 'Filter by endpoint path' })
  @ApiQuery({ name: 'statusCode', required: false, type: Number, description: 'Filter by HTTP status code' })
  @ApiQuery({ name: 'errorName', required: false, description: 'Filter by error name' })
  @ApiQuery({ name: 'fromDate', required: false, description: 'Filter from date (ISO string)' })
  @ApiQuery({ name: 'toDate', required: false, description: 'Filter to date (ISO string)' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number (default: 1)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page (default: 50)' })
  async findErrorLogs(
    @Query('userId') userId?: string,
    @Query('endpoint') endpoint?: string,
    @Query('statusCode') statusCode?: string,
    @Query('errorName') errorName?: string,
    @Query('fromDate') fromDate?: string,
    @Query('toDate') toDate?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const options: ErrorLogQueryOptions = {
      userId,
      endpoint,
      statusCode: statusCode ? parseInt(statusCode, 10) : undefined,
      errorName,
      fromDate: fromDate ? new Date(fromDate) : undefined,
      toDate: toDate ? new Date(toDate) : undefined,
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 50,
    };

    return this.auditLogService.findErrorLogs(options);
  }

  @Get('entity/:tableName/:entityId')
  @ApiOperation({ summary: 'Get full change history for a specific entity' })
  async getEntityHistory(
    @Param('tableName') tableName: string,
    @Param('entityId') entityId: string,
  ) {
    return this.auditLogService.getEntityHistory(tableName, entityId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single audit log entry' })
  async findOne(@Param('id') id: string) {
    return this.auditLogService.findOne(id);
  }
}
