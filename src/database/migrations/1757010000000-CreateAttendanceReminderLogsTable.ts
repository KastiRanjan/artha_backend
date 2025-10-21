import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

export class CreateAttendanceReminderLogsTable1757010000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'attendance_reminder_logs',
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
            type: 'varchar',
          },
          {
            name: 'date',
            type: 'date',
          },
          {
            name: 'reminderType',
            type: 'enum',
            enum: ['clock-in', 'clock-out'],
          },
          {
            name: 'sentAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'userEmail',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'userName',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'createdAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updatedAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'createdBy',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'updatedBy',
            type: 'varchar',
            isNullable: true,
          },
        ],
      }),
      true,
    );

    // Create unique index to prevent duplicate reminders
    await queryRunner.createIndex(
      'attendance_reminder_logs',
      new TableIndex({
        name: 'IDX_ATTENDANCE_REMINDER_UNIQUE',
        columnNames: ['userId', 'date', 'reminderType'],
        isUnique: true,
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('attendance_reminder_logs');
  }
}
