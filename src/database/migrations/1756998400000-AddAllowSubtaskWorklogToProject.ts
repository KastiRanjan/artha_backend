import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddAllowSubtaskWorklogToProject1756998400000 implements MigrationInterface {
  name = 'AddAllowSubtaskWorklogToProject1756998400000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add the allowSubtaskWorklog column to the project table
    await queryRunner.addColumn('project', new TableColumn({
      name: 'allowSubtaskWorklog',
      type: 'boolean',
      default: true,
      isNullable: false,
    }));
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remove the allowSubtaskWorklog column from the project table
    await queryRunner.dropColumn('project', 'allowSubtaskWorklog');
  }
}