import { ConnectionOptions } from 'typeorm';
import * as dotenv from 'dotenv';
import { AuditLog } from '../audit-log/entities/audit-log.model';

dotenv.config();

/**
 * TypeORM connection config for the audit log database.
 *
 * This is a SEPARATE PostgreSQL database dedicated to storing audit trails.
 * Configure it via the AUDIT_DB_* environment variables in your .env file.
 *
 * The connection is named 'audit' so it doesn't conflict with the default connection.
 */
const auditOrmConfig: ConnectionOptions = {
  name: 'audit',
  type: 'postgres',
  host: process.env.AUDIT_DB_HOST || process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.AUDIT_DB_PORT, 10) || parseInt(process.env.DB_PORT, 10) || 5432,
  username: process.env.AUDIT_DB_USERNAME || process.env.DB_USERNAME || 'postgres',
  password: process.env.AUDIT_DB_PASSWORD || process.env.DB_PASSWORD || 'admin',
  database: process.env.AUDIT_DB_NAME || 'artha_audit',
  entities: [AuditLog],
  logging: false,
  synchronize: true, // Auto-create audit tables. Set to false in production and use migrations.
};

export = auditOrmConfig;
