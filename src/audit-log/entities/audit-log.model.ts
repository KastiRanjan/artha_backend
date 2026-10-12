import {
  BaseEntity,
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn
} from 'typeorm';

/**
 * Audit action types
 */
export enum AuditAction {
  INSERT = 'INSERT',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE'
}

/**
 * AuditLog Entity - stored in a separate audit database.
 * Records every INSERT, UPDATE, and DELETE on tracked system tables.
 *
 * NOTE: This file is intentionally named .model.ts (not .entity.ts)
 * to prevent the main database's entity glob pattern from picking it up.
 * It is explicitly registered only on the 'audit' TypeORM connection.
 */
@Entity({ name: 'audit_log' })
export class AuditLog extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /**
   * The table/entity that was modified
   */
  @Index()
  @Column({ length: 100 })
  entityName: string;

  /**
   * The database table name
   */
  @Index()
  @Column({ length: 100 })
  tableName: string;

  /**
   * The primary key (UUID) of the affected row
   */
  @Index()
  @Column({ length: 100 })
  entityId: string;

  /**
   * The type of operation: INSERT, UPDATE, DELETE
   */
  @Index()
  @Column({
    type: 'enum',
    enum: AuditAction
  })
  action: AuditAction;

  /**
   * The user ID who performed the action (null for system operations)
   */
  @Index()
  @Column({ nullable: true, length: 100 })
  performedBy: string;

  /**
   * The username of the user who performed the action
   */
  @Column({ nullable: true, length: 200 })
  performedByName: string;

  /**
   * Snapshot of the old values (before the change). Null for INSERT.
   */
  @Column({ type: 'jsonb', nullable: true })
  oldValues: Record<string, any>;

  /**
   * Snapshot of the new values (after the change). Null for DELETE.
   */
  @Column({ type: 'jsonb', nullable: true })
  newValues: Record<string, any>;

  /**
   * Only the fields that changed (for UPDATE operations)
   */
  @Column({ type: 'jsonb', nullable: true })
  changedFields: Record<string, { old: any; new: any }>;

  /**
   * IP address of the request (if available)
   */
  @Column({ nullable: true, length: 50 })
  ipAddress: string;

  /**
   * The user agent string (if available)
   */
  @Column({ nullable: true, length: 500 })
  userAgent: string;

  /**
   * Timestamp when this audit entry was created
   */
  @CreateDateColumn({
    type: 'timestamp with time zone',
    default: () => 'CURRENT_TIMESTAMP'
  })
  createdAt: Date;
}
