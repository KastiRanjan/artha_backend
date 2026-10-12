import {
  Connection,
  EntitySubscriberInterface,
  EventSubscriber,
  InsertEvent,
  RemoveEvent,
  UpdateEvent,
  getConnection
} from 'typeorm';
import { AuditLog, AuditAction } from './entities/audit-log.model';
import { AuditContext } from './audit-context';
import {
  shouldAuditTable,
  redactSensitiveFields,
  isAuditLogEnabled
} from './audit-log.config';
import { Logger } from '@nestjs/common';

/**
 * TypeORM Entity Subscriber that intercepts all INSERT, UPDATE, and DELETE
 * operations on the default connection and writes audit logs to the
 * separate audit database.
 *
 * This subscriber is registered globally and uses the audit-log config
 * to determine which tables to track.
 */
@EventSubscriber()
export class AuditLogSubscriber implements EntitySubscriberInterface {
  private readonly logger = new Logger('AuditLogSubscriber');

  /**
   * Get the audit database connection.
   * Returns null if disabled or if connection is not available.
   */
  private getAuditConnection(): Connection | null {
    if (!isAuditLogEnabled()) {
      return null;
    }
    try {
      return getConnection('audit');
    } catch (error) {
      this.logger.warn(
        `Audit database connection not available: ${error.message}. Audit logging is disabled.`
      );
      return null;
    }
  }

  /**
   * Resolve the table name from a TypeORM event.
   */
  private getTableName(metadata: any): string {
    return metadata?.tableName || metadata?.name || 'unknown';
  }

  /**
   * Resolve the entity name (class name) from a TypeORM event.
   */
  private getEntityName(metadata: any): string {
    return metadata?.targetName || metadata?.name || 'unknown';
  }

  /**
   * Extract the entity ID from an entity object.
   */
  private getEntityId(entity: any): string {
    if (!entity) return 'unknown';
    return entity.id || entity.Id || entity.ID || 'unknown';
  }

  /**
   * Compute the diff between old and new values for UPDATE operations.
   */
  private computeChangedFields(
    oldValues: Record<string, any>,
    newValues: Record<string, any>
  ): Record<string, { old: any; new: any }> | null {
    if (!oldValues || !newValues) return null;

    const changed: Record<string, { old: any; new: any }> = {};

    for (const key of Object.keys(newValues)) {
      const oldVal = oldValues[key];
      const newVal = newValues[key];

      // Skip relation objects, functions, and undefined
      if (typeof newVal === 'function' || typeof oldVal === 'function') continue;
      if (newVal === undefined && oldVal === undefined) continue;

      // Deep compare using JSON serialization (handles dates, nested objects)
      const oldSerialized = JSON.stringify(oldVal ?? null);
      const newSerialized = JSON.stringify(newVal ?? null);

      if (oldSerialized !== newSerialized) {
        changed[key] = { old: oldVal ?? null, new: newVal ?? null };
      }
    }

    return Object.keys(changed).length > 0 ? changed : null;
  }

  /**
   * Serialize an entity to a plain object, removing circular references
   * and TypeORM internal properties.
   */
  private serializeEntity(entity: any): Record<string, any> | null {
    if (!entity) return null;

    const serialized: Record<string, any> = {};
    for (const key of Object.keys(entity)) {
      const value = entity[key];

      // Skip functions, symbols, and TypeORM internals
      if (typeof value === 'function') continue;
      if (typeof value === 'symbol') continue;
      if (key.startsWith('__')) continue;

      // Skip relation objects (entities with their own 'id' property that are objects)
      if (value && typeof value === 'object' && !Array.isArray(value) && !(value instanceof Date)) {
        // Keep simple objects (like JSON columns), skip entity relations
        if (value.constructor && value.constructor.name !== 'Object') {
          continue;
        }
      }

      // Skip arrays (relations)
      if (Array.isArray(value)) continue;

      serialized[key] = value;
    }

    return serialized;
  }

  /**
   * Write an audit log entry to the audit database.
   * Runs asynchronously and does NOT block the original operation.
   */
  private async writeAuditLog(
    action: AuditAction,
    tableName: string,
    entityName: string,
    entityId: string,
    oldValues: Record<string, any> | null,
    newValues: Record<string, any> | null,
    changedFields: Record<string, { old: any; new: any }> | null
  ): Promise<void> {
    try {
      const auditConnection = this.getAuditConnection();
      if (!auditConnection) return;

      const auditRepo = auditConnection.getRepository(AuditLog);

      const auditEntry = auditRepo.create({
        entityName,
        tableName,
        entityId,
        action,
        performedBy: AuditContext.getUserId(),
        performedByName: AuditContext.getUserName(),
        oldValues: redactSensitiveFields(oldValues),
        newValues: redactSensitiveFields(newValues),
        changedFields: changedFields
          ? redactSensitiveFields(changedFields as any) as any
          : null,
        ipAddress: AuditContext.getIpAddress(),
        userAgent: AuditContext.getUserAgent(),
      });

      await auditRepo.save(auditEntry);
    } catch (error) {
      // NEVER let audit logging failures break the application
      this.logger.error(
        `Failed to write audit log for ${action} on ${tableName}:${entityId}: ${error.message}`,
        error.stack
      );
    }
  }

  /**
   * Called after a new entity is inserted.
   */
  afterInsert(event: InsertEvent<any>): void {
    if (!isAuditLogEnabled()) return;

    const tableName = this.getTableName(event.metadata);

    if (!shouldAuditTable(tableName)) return;

    const entityName = this.getEntityName(event.metadata);
    const entityId = this.getEntityId(event.entity);
    const newValues = this.serializeEntity(event.entity);

    // Fire and forget — don't await
    this.writeAuditLog(
      AuditAction.INSERT,
      tableName,
      entityName,
      entityId,
      null,
      newValues,
      null
    );
  }

  /**
   * Called after an entity is updated.
   */
  afterUpdate(event: UpdateEvent<any>): void {
    if (!isAuditLogEnabled()) return;

    const tableName = this.getTableName(event.metadata);

    if (!shouldAuditTable(tableName)) return;

    const entityName = this.getEntityName(event.metadata);
    const entityId = this.getEntityId(event.entity) || this.getEntityId(event.databaseEntity);

    const oldValues = this.serializeEntity(event.databaseEntity);
    const newValues = this.serializeEntity(event.entity);
    const changedFields = this.computeChangedFields(oldValues, newValues);

    // Only log if something actually changed
    if (!changedFields && oldValues && newValues) return;

    this.writeAuditLog(
      AuditAction.UPDATE,
      tableName,
      entityName,
      entityId,
      oldValues,
      newValues,
      changedFields
    );
  }

  /**
   * Called after an entity is removed (soft or hard delete).
   */
  afterRemove(event: RemoveEvent<any>): void {
    if (!isAuditLogEnabled()) return;

    const tableName = this.getTableName(event.metadata);

    if (!shouldAuditTable(tableName)) return;

    const entityName = this.getEntityName(event.metadata);
    const entityId = this.getEntityId(event.entity) || this.getEntityId(event.databaseEntity);
    const oldValues = this.serializeEntity(event.databaseEntity || event.entity);

    this.writeAuditLog(
      AuditAction.DELETE,
      tableName,
      entityName,
      entityId,
      oldValues,
      null,
      null
    );
  }
}
