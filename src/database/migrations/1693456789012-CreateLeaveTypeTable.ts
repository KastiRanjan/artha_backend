import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

export class CreateLeaveTypeTable1693456789012 implements MigrationInterface {
  name = 'CreateLeaveTypeTable1693456789012';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create leave_types table
    await queryRunner.createTable(
      new Table({
        name: 'leave_types',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'name',
            type: 'varchar',
            length: '100',
            isUnique: true,
            isNullable: false,
          },
          {
            name: 'description',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'maxDaysPerYear',
            type: 'int',
            isNullable: true,
          },
          {
            name: 'isActive',
            type: 'boolean',
            default: true,
            isNullable: false,
          },
          {
            name: 'createdAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            isNullable: false,
          },
          {
            name: 'updatedAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            onUpdate: 'CURRENT_TIMESTAMP',
            isNullable: false,
          },
        ],
      }),
    );

    // Add index on name for faster lookups
    await queryRunner.createIndex(
      'leave_types',
      new TableIndex({
        name: 'IDX_LEAVE_TYPE_NAME',
        columnNames: ['name'],
      }),
    );

    // Insert default leave types
    await queryRunner.query(`
      INSERT INTO leave_types (name, description, "maxDaysPerYear", "isActive") VALUES
      ('Annual Leave', 'Yearly vacation leave', 21, true),
      ('Sick Leave', 'Medical leave for illness', 12, true),
      ('Emergency Leave', 'Urgent personal matters', 5, true),
      ('Maternity Leave', 'Maternity leave for new mothers', 98, true),
      ('Paternity Leave', 'Paternity leave for new fathers', 15, true),
      ('Unpaid Leave', 'Leave without pay', NULL, true);
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop index
    await queryRunner.dropIndex('leave_types', 'IDX_LEAVE_TYPE_NAME');
    
    // Drop table
    await queryRunner.dropTable('leave_types');
  }
}
