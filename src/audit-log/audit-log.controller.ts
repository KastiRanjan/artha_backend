import {
  Controller,
  Get,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { AuditLogService, AuditLogQueryOptions } from './audit-log.service';
import { AuditAction } from './entities/audit-log.model';

@ApiTags('Audit Logs')
@ApiBearerAuth()
@Controller('audit-logs')
export class AuditLogController {
  constructor(private readonly auditLogService: AuditLogService) {}

  @Get()
  @ApiOperation({ summary: 'Query audit logs with filtering and pagination' })
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
    @Query('limit') limit?: string
  ) {
    const options: AuditLogQueryOptions = {
      tableName,
      entityId,
      action,
      performedBy,
      fromDate: fromDate ? new Date(fromDate) : undefined,
      toDate: toDate ? new Date(toDate) : undefined,
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 50
    };

    return this.auditLogService.findAll(options);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get audit log statistics' })
  @ApiQuery({ name: 'fromDate', required: false, description: 'Stats from date (ISO string)' })
  @ApiQuery({ name: 'toDate', required: false, description: 'Stats to date (ISO string)' })
  async getStats(
    @Query('fromDate') fromDate?: string,
    @Query('toDate') toDate?: string
  ) {
    return this.auditLogService.getStats(
      fromDate ? new Date(fromDate) : undefined,
      toDate ? new Date(toDate) : undefined
    );
  }

  @Get('entity/:tableName/:entityId')
  @ApiOperation({ summary: 'Get full change history for a specific entity' })
  async getEntityHistory(
    @Param('tableName') tableName: string,
    @Param('entityId') entityId: string
  ) {
    return this.auditLogService.getEntityHistory(tableName, entityId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single audit log entry' })
  async findOne(@Param('id') id: string) {
    return this.auditLogService.findOne(id);
  }
}
