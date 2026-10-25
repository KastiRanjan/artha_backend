import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { getConnection } from 'typeorm';
import { AuditLog, AuditAction } from './entities/audit-log.model';
import { AccessLog } from './entities/access-log.model';
import { ErrorLog } from './entities/error-log.model';
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

export interface AccessLogQueryOptions {
  userId?: string;
  endpoint?: string;
  method?: string;
  isHeavyOperation?: boolean;
  minDurationMs?: number;
  fromDate?: Date;
  toDate?: Date;
  page?: number;
  limit?: number;
}

export interface ErrorLogQueryOptions {
  userId?: string;
  endpoint?: string;
  statusCode?: number;
  errorName?: string;
  fromDate?: Date;
  toDate?: Date;
  page?: number;
  limit?: number;
}

/**
 * Redacts sensitive credentials (passwords, tokens, authorization keys)
 * before persisting payload into logs.
 */
function sanitizeObject(obj: any, maxDepth = 4): any {
  if (!obj || typeof obj !== 'object' || maxDepth < 0) return obj;
  if (Array.isArray(obj)) {
    return obj.map((item) => sanitizeObject(item, maxDepth - 1));
  }
  const SENSITIVE_KEYS = [
    'password',
    'passwordconfirmation',
    'token',
    'refreshtoken',
    'accesstoken',
    'authorization',
    'secret',
    'creditcard',
    'cvv',
    'pin',
  ];
  const sanitized: Record<string, any> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (SENSITIVE_KEYS.includes(key.toLowerCase())) {
      sanitized[key] = '***REDACTED***';
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeObject(value, maxDepth - 1);
    } else {
      sanitized[key] = value;
    }
  }
  return sanitized;
}

/**
 * Service for managing Audit Trails, Access Logs, and Error Logs.
 * Stores data in the dedicated audit database (or falls back safely to default database).
 */
@Injectable()
export class AuditLogService implements OnModuleInit {
  private readonly logger = new Logger('AuditLogService');

  async onModuleInit() {
    // Ensure access_log and error_log column sizes are safely expanded in production
    const conns: any[] = [];
    const auditConn = this.getAuditConnection();
    if (auditConn) conns.push(auditConn);
    try {
      const defaultConn = getConnection();
      if (defaultConn) conns.push(defaultConn);
    } catch (e) {
      // default connection may not be initialized yet
    }

    for (const conn of conns) {
      try {
        await conn.query('ALTER TABLE access_log ALTER COLUMN "action" TYPE character varying(500)');
        await conn.query('ALTER TABLE access_log ALTER COLUMN "endpoint" TYPE character varying(1000)');
        await conn.query('ALTER TABLE access_log ALTER COLUMN "userAgent" TYPE character varying(1000)');
        await conn.query('ALTER TABLE error_log ALTER COLUMN "endpoint" TYPE character varying(1000)');
        await conn.query('ALTER TABLE error_log ALTER COLUMN "userAgent" TYPE character varying(1000)');
      } catch (err) {
        // Table or columns may not exist yet or already altered
      }
    }
  }

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
        message: 'Audit logging is disabled in environment configuration',
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
        message: 'Audit database connection is not active',
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
      limit = 50,
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
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Get the full change history for a specific entity record.
   */
  async getEntityHistory(
    tableName: string,
    entityId: string,
  ): Promise<AuditLog[]> {
    if (!isAuditLogEnabled()) return [];
    const conn = this.getAuditConnection();
    if (!conn) return [];

    const auditRepo = conn.getRepository(AuditLog);

    return auditRepo.find({
      where: { tableName, entityId },
      order: { createdAt: 'DESC' },
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
        message: 'Audit logging is disabled in environment configuration',
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
        message: 'Audit database connection is not active',
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
      count: parseInt(row.count, 10),
    }));

    return { totalEntries, byAction, byTable, byUser };
  }

  /**
   * Directly log a single audit entry.
   * Attempts to write to the dedicated audit DB if active,
   * otherwise falls back to the default connection's audit_log table.
   */
  async logEntry(entry: Partial<AuditLog>): Promise<boolean> {
    const result = await this.logBatch([entry]);
    return result > 0;
  }

  /**
   * Directly log a batch of audit entries.
   * Tolerates partial/non-blocking failure for background jobs.
   */
  async logBatch(entries: Partial<AuditLog>[]): Promise<number> {
    if (!entries || entries.length === 0) return 0;

    // 1. Try dedicated audit connection if available
    const auditConn = this.getAuditConnection();
    if (auditConn) {
      try {
        const auditRepo = auditConn.getRepository(AuditLog);
        await auditRepo.save(entries as AuditLog[], { chunk: 100 });
        return entries.length;
      } catch (err) {
        this.logger.error(`Error saving audit logs to dedicated audit connection: ${err.message}`);
      }
    }

    // 2. Fallback to default connection's audit_log table
    try {
      const defaultConn = getConnection();
      if (defaultConn) {
        const chunkSize = 100;
        for (let i = 0; i < entries.length; i += chunkSize) {
          const chunk = entries.slice(i, i + chunkSize);
          const valueClauses: string[] = [];
          const params: any[] = [];
          let paramIdx = 1;

          for (const e of chunk) {
            valueClauses.push(
              `($${paramIdx++}, $${paramIdx++}, $${paramIdx++}, $${paramIdx++}, $${paramIdx++}, $${paramIdx++}, $${paramIdx++}, $${paramIdx++}, $${paramIdx++})`,
            );
            params.push(
              e.entityName,
              e.tableName,
              e.entityId,
              e.action,
              e.performedBy || null,
              e.performedByName || null,
              e.oldValues ? JSON.stringify(e.oldValues) : null,
              e.newValues ? JSON.stringify(e.newValues) : null,
              e.changedFields ? JSON.stringify(e.changedFields) : null,
            );
          }

          const sql = `
            INSERT INTO audit_log ("entityName", "tableName", "entityId", "action", "performedBy", "performedByName", "oldValues", "newValues", "changedFields")
            VALUES ${valueClauses.join(', ')}
          `;
          await defaultConn.query(sql, params);
        }
        return entries.length;
      }
    } catch (fallbackErr) {
      this.logger.error(`Fallback audit log save failed on default connection: ${fallbackErr.message}`);
    }

    return 0;
  }

  /**
   * Strictly logs a batch of audit entries.
   * If any entry fails to persist or the saved count does not match entries.length,
   * it throws an error immediately so any caller transaction aborts/rolls back,
   * GUARANTEEING ZERO DATA LOSS on delete operations.
   */
  async logBatchStrict(entries: Partial<AuditLog>[]): Promise<number> {
    if (!entries || entries.length === 0) return 0;

    // 1. Try dedicated audit connection if available
    const auditConn = this.getAuditConnection();
    if (auditConn) {
      const auditRepo = auditConn.getRepository(AuditLog);
      const saved = await auditRepo.save(entries as AuditLog[], { chunk: 100 });
      if (!saved || saved.length !== entries.length) {
        throw new Error(
          `Strict audit log persistence mismatch: Expected ${entries.length} records saved, got ${saved?.length || 0}. Operation aborted to prevent data loss.`,
        );
      }
      return saved.length;
    }

    // 2. Fallback to default connection's audit_log table
    const defaultConn = getConnection();
    if (!defaultConn) {
      throw new Error(
        'No database connection available to store audit logs. Operation aborted to prevent data loss.',
      );
    }

    const chunkSize = 100;
    let totalInserted = 0;
    for (let i = 0; i < entries.length; i += chunkSize) {
      const chunk = entries.slice(i, i + chunkSize);
      const valueClauses: string[] = [];
      const params: any[] = [];
      let paramIdx = 1;

      for (const e of chunk) {
        valueClauses.push(
          `($${paramIdx++}, $${paramIdx++}, $${paramIdx++}, $${paramIdx++}, $${paramIdx++}, $${paramIdx++}, $${paramIdx++}, $${paramIdx++}, $${paramIdx++})`,
        );
        params.push(
          e.entityName,
          e.tableName,
          e.entityId,
          e.action,
          e.performedBy || null,
          e.performedByName || null,
          e.oldValues ? JSON.stringify(e.oldValues) : null,
          e.newValues ? JSON.stringify(e.newValues) : null,
          e.changedFields ? JSON.stringify(e.changedFields) : null,
        );
      }

      const sql = `
        INSERT INTO audit_log ("entityName", "tableName", "entityId", "action", "performedBy", "performedByName", "oldValues", "newValues", "changedFields")
        VALUES ${valueClauses.join(', ')}
      `;
      await defaultConn.query(sql, params);
      totalInserted += chunk.length;
    }

    if (totalInserted !== entries.length) {
      throw new Error(
        `Strict fallback audit log persistence mismatch: Expected ${entries.length}, inserted ${totalInserted}. Aborted to prevent data loss.`,
      );
    }
    return totalInserted;
  }

  /**
   * Log server access / API requests to access_log table.
   * Automatically detects and flags heavy operations (duration >= threshold, default 2000ms).
   * Sanitizes sensitive fields in request bodies (passwords, tokens).
   */
  async logAccess(entry: Partial<AccessLog>): Promise<boolean> {
    try {
      const durationMs = entry.durationMs || 0;
      const thresholdMs = parseInt(
        process.env.HEAVY_OPERATION_THRESHOLD_MS || '2000',
        10,
      );
      const isHeavy = entry.isHeavyOperation ?? durationMs >= thresholdMs;

      const sanitizedBody = entry.requestBody ? sanitizeObject(entry.requestBody) : null;
      const sanitizedQuery = entry.requestQuery ? sanitizeObject(entry.requestQuery) : null;

      const normalizedEntry = {
        ...entry,
        userId: entry.userId ? String(entry.userId).slice(0, 90) : null,
        userName: entry.userName ? String(entry.userName).slice(0, 190) : null,
        userEmail: entry.userEmail ? String(entry.userEmail).slice(0, 190) : null,
        ipAddress: entry.ipAddress ? String(entry.ipAddress).slice(0, 45) : null,
        userAgent: entry.userAgent ? String(entry.userAgent).slice(0, 950) : null,
        method: entry.method ? String(entry.method).slice(0, 10) : 'GET',
        endpoint: entry.endpoint ? String(entry.endpoint).slice(0, 950) : '',
        action: entry.action ? String(entry.action).slice(0, 480) : null,
        isHeavyOperation: isHeavy,
        requestBody: sanitizedBody,
        requestQuery: sanitizedQuery,
      };

      // 1. Try dedicated audit connection
      const auditConn = this.getAuditConnection();
      if (auditConn) {
        try {
          const accessRepo = auditConn.getRepository(AccessLog);
          const record = accessRepo.create(normalizedEntry);
          await accessRepo.save(record);
          return true;
        } catch (err) {
          this.logger.error(`Error saving access log to audit connection: ${err.message}`);
        }
      }

      // 2. Fallback to default connection
      const defaultConn = getConnection();
      if (defaultConn) {
        const sql = `
          INSERT INTO access_log (
            "userId", "userName", "userEmail", "ipAddress", "userAgent",
            "method", "endpoint", "statusCode", "durationMs", "isHeavyOperation",
            "requestQuery", "requestBody", "action", "description"
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
        `;
        await defaultConn.query(sql, [
          normalizedEntry.userId,
          normalizedEntry.userName,
          normalizedEntry.userEmail,
          normalizedEntry.ipAddress,
          normalizedEntry.userAgent,
          normalizedEntry.method,
          normalizedEntry.endpoint,
          normalizedEntry.statusCode || 200,
          durationMs,
          isHeavy,
          sanitizedQuery ? JSON.stringify(sanitizedQuery) : null,
          sanitizedBody ? JSON.stringify(sanitizedBody) : null,
          normalizedEntry.action,
          normalizedEntry.description || null,
        ]);
        return true;
      }
    } catch (err) {
      this.logger.error(`Failed to record access log: ${err.message}`);
    }
    return false;
  }

  /**
   * Log application errors and exceptions to error_log table.
   * Stores error message, stack trace, status code, endpoint, and user context.
   */
  async logError(entry: Partial<ErrorLog>): Promise<boolean> {
    try {
      const sanitizedPayload = entry.requestPayload ? sanitizeObject(entry.requestPayload) : null;

      const normalizedEntry = {
        ...entry,
        userId: entry.userId ? String(entry.userId).slice(0, 90) : null,
        userName: entry.userName ? String(entry.userName).slice(0, 190) : null,
        userEmail: entry.userEmail ? String(entry.userEmail).slice(0, 190) : null,
        ipAddress: entry.ipAddress ? String(entry.ipAddress).slice(0, 45) : null,
        userAgent: entry.userAgent ? String(entry.userAgent).slice(0, 950) : null,
        endpoint: entry.endpoint ? String(entry.endpoint).slice(0, 950) : '',
        method: entry.method ? String(entry.method).slice(0, 10) : 'GET',
        errorName: entry.errorName ? String(entry.errorName).slice(0, 190) : 'Error',
        context: entry.context ? String(entry.context).slice(0, 190) : null,
        requestPayload: sanitizedPayload,
      };

      // 1. Try dedicated audit connection
      const auditConn = this.getAuditConnection();
      if (auditConn) {
        try {
          const errorRepo = auditConn.getRepository(ErrorLog);
          const record = errorRepo.create(normalizedEntry);
          await errorRepo.save(record);
          return true;
        } catch (err) {
          this.logger.error(`Error saving error log to audit connection: ${err.message}`);
        }
      }

      // 2. Fallback to default connection
      const defaultConn = getConnection();
      if (defaultConn) {
        const sql = `
          INSERT INTO error_log (
            "userId", "userName", "userEmail", "ipAddress", "userAgent",
            "endpoint", "method", "statusCode", "errorName", "errorMessage",
            "stackTrace", "requestPayload", "context"
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
        `;
        await defaultConn.query(sql, [
          normalizedEntry.userId,
          normalizedEntry.userName,
          normalizedEntry.userEmail,
          normalizedEntry.ipAddress,
          normalizedEntry.userAgent,
          normalizedEntry.endpoint,
          normalizedEntry.method,
          normalizedEntry.statusCode || 500,
          normalizedEntry.errorName,
          normalizedEntry.errorMessage || 'An error occurred',
          normalizedEntry.stackTrace || null,
          sanitizedPayload ? JSON.stringify(sanitizedPayload) : null,
          normalizedEntry.context,
        ]);
        return true;
      }
    } catch (err) {
      this.logger.error(`Failed to record error log: ${err.message}`);
    }
    return false;
  }

  /**
   * Query access logs with filtering (user, endpoint, method, heavy operations) and pagination.
   */
  async findAccessLogs(options: AccessLogQueryOptions = {}): Promise<{
    data: AccessLog[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const {
      userId,
      endpoint,
      method,
      isHeavyOperation,
      minDurationMs,
      fromDate,
      toDate,
      page = 1,
      limit = 50,
    } = options;

    const auditConn = this.getAuditConnection();
    if (auditConn) {
      const repo = auditConn.getRepository(AccessLog);
      const qb = repo.createQueryBuilder('log');

      if (userId) qb.andWhere('log.userId = :userId', { userId });
      if (endpoint) qb.andWhere('log.endpoint ILIKE :endpoint', { endpoint: `%${endpoint}%` });
      if (method) qb.andWhere('log.method = :method', { method: method.toUpperCase() });
      if (isHeavyOperation !== undefined) {
        qb.andWhere('log.isHeavyOperation = :isHeavyOperation', { isHeavyOperation });
      }
      if (minDurationMs !== undefined) {
        qb.andWhere('log.durationMs >= :minDurationMs', { minDurationMs });
      }
      if (fromDate) qb.andWhere('log.createdAt >= :fromDate', { fromDate });
      if (toDate) qb.andWhere('log.createdAt <= :toDate', { toDate });

      qb.orderBy('log.createdAt', 'DESC');
      qb.skip((page - 1) * limit);
      qb.take(limit);

      const [data, total] = await qb.getManyAndCount();
      return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
    }

    // Default connection fallback
    const defaultConn = getConnection();
    if (defaultConn) {
      const conditions: string[] = [];
      const params: any[] = [];
      let idx = 1;

      if (userId) {
        conditions.push(`"userId" = $${idx++}`);
        params.push(userId);
      }
      if (endpoint) {
        conditions.push(`"endpoint" ILIKE $${idx++}`);
        params.push(`%${endpoint}%`);
      }
      if (method) {
        conditions.push(`"method" = $${idx++}`);
        params.push(method.toUpperCase());
      }
      if (isHeavyOperation !== undefined) {
        conditions.push(`"isHeavyOperation" = $${idx++}`);
        params.push(isHeavyOperation);
      }
      if (minDurationMs !== undefined) {
        conditions.push(`"durationMs" >= $${idx++}`);
        params.push(minDurationMs);
      }
      if (fromDate) {
        conditions.push(`"createdAt" >= $${idx++}`);
        params.push(fromDate);
      }
      if (toDate) {
        conditions.push(`"createdAt" <= $${idx++}`);
        params.push(toDate);
      }

      const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
      const countRes = await defaultConn.query(`SELECT COUNT(*) as count FROM access_log ${whereClause}`, params);
      const total = parseInt(countRes[0]?.count || '0', 10);

      const offset = (page - 1) * limit;
      const dataRes = await defaultConn.query(
        `SELECT * FROM access_log ${whereClause} ORDER BY "createdAt" DESC LIMIT $${idx++} OFFSET $${idx++}`,
        [...params, limit, offset],
      );

      return { data: dataRes, total, page, limit, totalPages: Math.ceil(total / limit) };
    }

    return { data: [], total: 0, page, limit, totalPages: 0 };
  }

  /**
   * Find operations that took longer than threshold (default: 2000ms) or caused high DB load.
   */
  async findHeavyOperations(
    options: { minDurationMs?: number; page?: number; limit?: number } = {},
  ) {
    const defaultThreshold = parseInt(
      process.env.HEAVY_OPERATION_THRESHOLD_MS || '2000',
      10,
    );
    return this.findAccessLogs({
      ...options,
      isHeavyOperation: true,
      minDurationMs: options.minDurationMs ?? defaultThreshold,
    });
  }

  /**
   * Query error logs with filtering and pagination.
   */
  async findErrorLogs(options: ErrorLogQueryOptions = {}): Promise<{
    data: ErrorLog[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const {
      userId,
      endpoint,
      statusCode,
      errorName,
      fromDate,
      toDate,
      page = 1,
      limit = 50,
    } = options;

    const auditConn = this.getAuditConnection();
    if (auditConn) {
      const repo = auditConn.getRepository(ErrorLog);
      const qb = repo.createQueryBuilder('log');

      if (userId) qb.andWhere('log.userId = :userId', { userId });
      if (endpoint) qb.andWhere('log.endpoint ILIKE :endpoint', { endpoint: `%${endpoint}%` });
      if (statusCode) qb.andWhere('log.statusCode = :statusCode', { statusCode });
      if (errorName) qb.andWhere('log.errorName ILIKE :errorName', { errorName: `%${errorName}%` });
      if (fromDate) qb.andWhere('log.createdAt >= :fromDate', { fromDate });
      if (toDate) qb.andWhere('log.createdAt <= :toDate', { toDate });

      qb.orderBy('log.createdAt', 'DESC');
      qb.skip((page - 1) * limit);
      qb.take(limit);

      const [data, total] = await qb.getManyAndCount();
      return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
    }

    // Default connection fallback
    const defaultConn = getConnection();
    if (defaultConn) {
      const conditions: string[] = [];
      const params: any[] = [];
      let idx = 1;

      if (userId) {
        conditions.push(`"userId" = $${idx++}`);
        params.push(userId);
      }
      if (endpoint) {
        conditions.push(`"endpoint" ILIKE $${idx++}`);
        params.push(`%${endpoint}%`);
      }
      if (statusCode) {
        conditions.push(`"statusCode" = $${idx++}`);
        params.push(statusCode);
      }
      if (errorName) {
        conditions.push(`"errorName" ILIKE $${idx++}`);
        params.push(`%${errorName}%`);
      }
      if (fromDate) {
        conditions.push(`"createdAt" >= $${idx++}`);
        params.push(fromDate);
      }
      if (toDate) {
        conditions.push(`"createdAt" <= $${idx++}`);
        params.push(toDate);
      }

      const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
      const countRes = await defaultConn.query(`SELECT COUNT(*) as count FROM error_log ${whereClause}`, params);
      const total = parseInt(countRes[0]?.count || '0', 10);

      const offset = (page - 1) * limit;
      const dataRes = await defaultConn.query(
        `SELECT * FROM error_log ${whereClause} ORDER BY "createdAt" DESC LIMIT $${idx++} OFFSET $${idx++}`,
        [...params, limit, offset],
      );

      return { data: dataRes, total, page, limit, totalPages: Math.ceil(total / limit) };
    }

    return { data: [], total: 0, page, limit, totalPages: 0 };
  }

  /**
   * Get statistics of server accesses, heavy operations, and slow endpoints.
   */
  async getAccessStats(fromDate?: Date, toDate?: Date) {
    const auditConn = this.getAuditConnection();
    const conn = auditConn || (isAuditLogEnabled() ? null : getConnection());
    if (!conn) {
      return { totalRequests: 0, heavyOperationsCount: 0, avgDurationMs: 0, topSlowEndpoints: [] };
    }

    try {
      const repo = conn.getRepository(AccessLog);
      const qb = repo.createQueryBuilder('log');
      if (fromDate) qb.andWhere('log.createdAt >= :fromDate', { fromDate });
      if (toDate) qb.andWhere('log.createdAt <= :toDate', { toDate });

      const totalRequests = await qb.getCount();

      const heavyCount = await repo
        .createQueryBuilder('log')
        .where('log.isHeavyOperation = :heavy', { heavy: true })
        .andWhere(fromDate ? 'log.createdAt >= :fromDate' : '1=1', { fromDate })
        .andWhere(toDate ? 'log.createdAt <= :toDate' : '1=1', { toDate })
        .getCount();

      const avgRes = await repo
        .createQueryBuilder('log')
        .select('AVG(log.durationMs)', 'avg')
        .andWhere(fromDate ? 'log.createdAt >= :fromDate' : '1=1', { fromDate })
        .andWhere(toDate ? 'log.createdAt <= :toDate' : '1=1', { toDate })
        .getRawOne();
      const avgDurationMs = Math.round(parseFloat(avgRes?.avg || '0'));

      const topSlow = await repo
        .createQueryBuilder('log')
        .select('log.endpoint', 'endpoint')
        .addSelect('log.method', 'method')
        .addSelect('AVG(log.durationMs)', 'avgDurationMs')
        .addSelect('COUNT(*)', 'count')
        .groupBy('log.endpoint')
        .addGroupBy('log.method')
        .orderBy('"avgDurationMs"', 'DESC')
        .limit(10)
        .getRawMany();

      return {
        totalRequests,
        heavyOperationsCount: heavyCount,
        avgDurationMs,
        topSlowEndpoints: topSlow.map((row) => ({
          endpoint: row.endpoint,
          method: row.method,
          avgDurationMs: Math.round(parseFloat(row.avgDurationMs || '0')),
          count: parseInt(row.count, 10),
        })),
      };
    } catch (err) {
      // Raw SQL fallback
      try {
        const total = await conn.query('SELECT COUNT(*) as count FROM access_log');
        const heavy = await conn.query('SELECT COUNT(*) as count FROM access_log WHERE "isHeavyOperation" = true');
        const avg = await conn.query('SELECT AVG("durationMs") as avg FROM access_log');
        const topSlow = await conn.query(`
          SELECT endpoint, method, AVG("durationMs") as "avgDurationMs", COUNT(*) as count
          FROM access_log
          GROUP BY endpoint, method
          ORDER BY "avgDurationMs" DESC
          LIMIT 10
        `);
        return {
          totalRequests: parseInt(total[0]?.count || '0', 10),
          heavyOperationsCount: parseInt(heavy[0]?.count || '0', 10),
          avgDurationMs: Math.round(parseFloat(avg[0]?.avg || '0')),
          topSlowEndpoints: topSlow.map((r: any) => ({
            endpoint: r.endpoint,
            method: r.method,
            avgDurationMs: Math.round(parseFloat(r.avgDurationMs || '0')),
            count: parseInt(r.count, 10),
          })),
        };
      } catch (sqlErr) {
        this.logger.error(`Error calculating access stats: ${sqlErr.message}`);
        return { totalRequests: 0, heavyOperationsCount: 0, avgDurationMs: 0, topSlowEndpoints: [] };
      }
    }
  }
}
