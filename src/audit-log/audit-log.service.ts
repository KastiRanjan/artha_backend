import { Injectable, Logger } from '@nestjs/common';
import { getConnection } from 'typeorm';
import { AuditLog, AuditAction } from './entities/audit-log.model';
import { isAuditLogEnabled } from './audit-log.config';

export interface AuditLogQueryOptions {
  /** Filter by table name */
  tableName?: string;
  /** Filter by entity ID */
  entityId?: string;
  /** Filter by action type */
  action?: AuditAction;
  /** Filter by the user who performed the action */
  performedBy?: string;
  /** Filter from this date */
  fromDate?: Date;
  /** Filter to this date */
  toDate?: Date;
  /** Page number (1-indexed) */
  page?: number;
  /** Items per page */
  limit?: number;
}

/**
 * Service for querying audit logs.
 * Connects to the separate audit database.
 */
@Injectable()
export class AuditLogService {
  private readonly logger = new Logger('AuditLogService');

  private getAuditConnection() {
    if (!isAuditLogEnabled()) {
      return null;
    }
    try {
      return getConnection('audit');
    } catch (error) {
      this.logger.error(`Audit database connection not available: ${error.message}`);
      return null;
    }
  }

  /**
   * Query audit logs with filtering and pagination.
   */
  async findAll(options: AuditLogQueryOptions = {}): Promise<{
    data: AuditLog[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    enabled?: boolean;
    message?: string;
  }> {
    if (!isAuditLogEnabled()) {
      return {
        data: [],
        total: 0,
        page: options.page || 1,
        limit: options.limit || 50,
        totalPages: 0,
        enabled: false,
        message: 'Audit logging is disabled in environment configuration'
      };
    }

    const conn = this.getAuditConnection();
    if (!conn) {
      return {
        data: [],
        total: 0,
        page: options.page || 1,
        limit: options.limit || 50,
        totalPages: 0,
        enabled: false,
        message: 'Audit database connection is not active'
      };
    }

    const {
      tableName,
      entityId,
      action,
      performedBy,
      fromDate,
      toDate,
      page = 1,
      limit = 50
    } = options;

    const auditRepo = conn.getRepository(AuditLog);
    const qb = auditRepo.createQueryBuilder('audit');

    if (tableName) {
      qb.andWhere('audit.tableName = :tableName', { tableName });
    }

    if (entityId) {
      qb.andWhere('audit.entityId = :entityId', { entityId });
    }

    if (action) {
      qb.andWhere('audit.action = :action', { action });
    }

    if (performedBy) {
      qb.andWhere('audit.performedBy = :performedBy', { performedBy });
    }

    if (fromDate) {
      qb.andWhere('audit.createdAt >= :fromDate', { fromDate });
    }

    if (toDate) {
      qb.andWhere('audit.createdAt <= :toDate', { toDate });
    }

    qb.orderBy('audit.createdAt', 'DESC');
    qb.skip((page - 1) * limit);
    qb.take(limit);

    const [data, total] = await qb.getManyAndCount();

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    };
  }

  /**
   * Get the full change history for a specific entity record.
   */
  async getEntityHistory(
    tableName: string,
    entityId: string
  ): Promise<AuditLog[]> {
    if (!isAuditLogEnabled()) return [];
    const conn = this.getAuditConnection();
    if (!conn) return [];

    const auditRepo = conn.getRepository(AuditLog);

    return auditRepo.find({
      where: { tableName, entityId },
      order: { createdAt: 'DESC' }
    });
  }

  /**
   * Get a single audit log entry by ID.
   */
  async findOne(id: string): Promise<AuditLog | undefined> {
    if (!isAuditLogEnabled()) return undefined;
    const conn = this.getAuditConnection();
    if (!conn) return undefined;

    const auditRepo = conn.getRepository(AuditLog);
    return auditRepo.findOne(id);
  }

  /**
   * Get audit log statistics (for dashboard).
   */
  async getStats(fromDate?: Date, toDate?: Date): Promise<{
    totalEntries: number;
    byAction: Record<string, number>;
    byTable: Record<string, number>;
    byUser: { userId: string; userName: string; count: number }[];
    enabled?: boolean;
    message?: string;
  }> {
    if (!isAuditLogEnabled()) {
      return {
        totalEntries: 0,
        byAction: {},
        byTable: {},
        byUser: [],
        enabled: false,
        message: 'Audit logging is disabled in environment configuration'
      };
    }

    const conn = this.getAuditConnection();
    if (!conn) {
      return {
        totalEntries: 0,
        byAction: {},
        byTable: {},
        byUser: [],
        enabled: false,
        message: 'Audit database connection is not active'
      };
    }

    const auditRepo = conn.getRepository(AuditLog);
    const qb = auditRepo.createQueryBuilder('audit');

    if (fromDate) {
      qb.andWhere('audit.createdAt >= :fromDate', { fromDate });
    }

    if (toDate) {
      qb.andWhere('audit.createdAt <= :toDate', { toDate });
    }

    const totalEntries = await qb.getCount();

    // Count by action
    const actionCounts = await auditRepo
      .createQueryBuilder('audit')
      .select('audit.action', 'action')
      .addSelect('COUNT(*)', 'count')
      .groupBy('audit.action')
      .getRawMany();

    const byAction: Record<string, number> = {};
    actionCounts.forEach((row) => {
      byAction[row.action] = parseInt(row.count, 10);
    });

    // Count by table (top 20)
    const tableCounts = await auditRepo
      .createQueryBuilder('audit')
      .select('audit.tableName', 'tableName')
      .addSelect('COUNT(*)', 'count')
      .groupBy('audit.tableName')
      .orderBy('count', 'DESC')
      .limit(20)
      .getRawMany();

    const byTable: Record<string, number> = {};
    tableCounts.forEach((row) => {
      byTable[row.tableName] = parseInt(row.count, 10);
    });

    // Count by user (top 20)
    const userCounts = await auditRepo
      .createQueryBuilder('audit')
      .select('audit.performedBy', 'userId')
      .addSelect('audit.performedByName', 'userName')
      .addSelect('COUNT(*)', 'count')
      .where('audit.performedBy IS NOT NULL')
      .groupBy('audit.performedBy')
      .addGroupBy('audit.performedByName')
      .orderBy('count', 'DESC')
      .limit(20)
      .getRawMany();

    const byUser = userCounts.map((row) => ({
      userId: row.userId,
      userName: row.userName,
      count: parseInt(row.count, 10)
    }));

    return { totalEntries, byAction, byTable, byUser };
  }
}
