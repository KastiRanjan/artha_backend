import { ConnectionOptions } from 'typeorm';
import * as config from 'config';

const dbConfig = config.get('db');
console.log(process.env.DB_TYPE);
const ormConfig: ConnectionOptions = {
  type: 'postgres',
  host: 'localhost',
  port: 5432,
  username: 'postgres',
  password: 'admin',
  database: 'artha',
  // migrationsTransactionMode: 'each',
  entities: [__dirname + '/../**/*.entity.{js,ts}'],
  logging: false,
  synchronize: true,
  migrationsRun: process.env.NODE_ENV === 'test',
  dropSchema: process.env.NODE_ENV === 'test',
  migrationsTableName: 'migrations',
  migrations: [__dirname + '/../database/migrations/**/*{.ts,.js}'],
  cli: {
    migrationsDir: 'src/database/migrations'
  }
};

export = ormConfig;
