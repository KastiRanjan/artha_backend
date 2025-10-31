import { MigrationInterface, QueryRunner, Table, TableForeignKey, TableIndex } from 'typeorm';

export class AddUserLeaveBalanceAndLeaveTypeEnhancements1730390000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add new columns to leave_types table
    await queryRunner.query(`
      ALTER TABLE leave_types
      ADD COLUMN IF NOT EXISTS "isEmergency" boolean NOT NULL DEFAULT false,
      ADD COLUMN IF NOT EXISTS "allowCarryOver" boolean NOT NULL DEFAULT false,
      ADD COLUMN IF NOT EXISTS "maxCarryOverDays" integer
    `);

    // Create user_leave_balances table
    await queryRunner.createTable(
      new Table({
        name: 'user_leave_balances',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'userId',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'leaveTypeId',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'year',
            type: 'integer',
            isNullable: false,
          },
          {
            name: 'allocatedDays',
            type: 'decimal',
            precision: 5,
            scale: 2,
            default: 0,
          },
          {
            name: 'carriedOverDays',
            type: 'decimal',
            precision: 5,
            scale: 2,
            default: 0,
          },
          {
            name: 'usedDays',
            type: 'decimal',
            precision: 5,
            scale: 2,
            default: 0,
          },
          {
            name: 'pendingDays',
            type: 'decimal',
            precision: 5,
            scale: 2,
            default: 0,
          },
          {
            name: 'createdAt',
            type: 'timestamp',
            default: 'now()',
          },
          {
            name: 'updatedAt',
            type: 'timestamp',
            default: 'now()',
          },
        ],
      }),
      true,
    );

    // Create foreign keys
    await queryRunner.createForeignKey(
      'user_leave_balances',
      new TableForeignKey({
        columnNames: ['userId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'user',
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'user_leave_balances',
      new TableForeignKey({
        columnNames: ['leaveTypeId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'leave_types',
        onDelete: 'CASCADE',
      }),
    );

    // Create unique index for user, leaveType, and year combination
    await queryRunner.createIndex(
      'user_leave_balances',
      new TableIndex({
        name: 'IDX_user_leave_balance_unique',
        columnNames: ['userId', 'leaveTypeId', 'year'],
        isUnique: true,
      }),
    );

    // Create indexes for faster queries
    await queryRunner.createIndex(
      'user_leave_balances',
      new TableIndex({
        name: 'IDX_user_leave_balance_user',
        columnNames: ['userId'],
      }),
    );

    await queryRunner.createIndex(
      'user_leave_balances',
      new TableIndex({
        name: 'IDX_user_leave_balance_year',
        columnNames: ['year'],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop indexes
    await queryRunner.dropIndex('user_leave_balances', 'IDX_user_leave_balance_year');
    await queryRunner.dropIndex('user_leave_balances', 'IDX_user_leave_balance_user');
    await queryRunner.dropIndex('user_leave_balances', 'IDX_user_leave_balance_unique');

    // Drop foreign keys
    const table = await queryRunner.getTable('user_leave_balances');
    const userForeignKey = table.foreignKeys.find(fk => fk.columnNames.indexOf('userId') !== -1);
    const leaveTypeForeignKey = table.foreignKeys.find(fk => fk.columnNames.indexOf('leaveTypeId') !== -1);
    
    if (userForeignKey) {
      await queryRunner.dropForeignKey('user_leave_balances', userForeignKey);
    }
    if (leaveTypeForeignKey) {
      await queryRunner.dropForeignKey('user_leave_balances', leaveTypeForeignKey);
    }

    // Drop table
    await queryRunner.dropTable('user_leave_balances');

    // Remove columns from leave_types
    await queryRunner.query(`
      ALTER TABLE leave_types
      DROP COLUMN IF EXISTS "maxCarryOverDays",
      DROP COLUMN IF EXISTS "allowCarryOver",
      DROP COLUMN IF EXISTS "isEmergency"
    `);
  }
}
