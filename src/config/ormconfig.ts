import { ConnectionOptions } from 'typeorm';
import * as dotenv from 'dotenv';
import { AuditLogSubscriber } from '../audit-log/audit-log.subscriber';
import { isAuditLogEnabled } from '../audit-log/audit-log.config';

dotenv.config();

const ormConfig: ConnectionOptions = {
  type: 'postgres',
  // url: 'postgres://postgres:postgres@postgres:5432/artha',
  port: parseInt(process.env.DB_PORT, 10) || 5432,
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'admin',
  database: process.env.DB_NAME || 'arthalive',
  migrationsTransactionMode: 'each',
  entities: [__dirname + '/../**/*.entity.{js,ts}'],
  // Only register the audit log subscriber if explicitly enabled via env
  subscribers: isAuditLogEnabled() ? [AuditLogSubscriber] : [],
  logging: false,
  synchronize: true,
  migrationsRun: process.env.NODE_ENV === 'test',
  dropSchema: process.env.NODE_ENV === 'test',
  migrationsTableName: 'migrations',
  migrations: [__dirname + '/../database/migrations/**/*{.ts,.js}'],
  cli: {
    migrationsDir: 'src/database/migrations'
  }
  // extra: {
  //   "ssl": true
  // }
};

export = ormConfig;
