import { MigrationInterface, QueryRunner } from "typeorm";

export class AddShortNameToCustomer1699999999999 implements MigrationInterface {
    name = 'AddShortNameToCustomer1699999999999'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Check if column exists before adding it
        const hasColumn = await queryRunner.hasColumn("customer", "shortName");
        if (!hasColumn) {
            await queryRunner.query(`ALTER TABLE "customer" ADD "shortName" character varying(20)`);
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        const hasColumn = await queryRunner.hasColumn("customer", "shortName");
        if (hasColumn) {
            await queryRunner.query(`ALTER TABLE "customer" DROP COLUMN "shortName"`);
        }
    }
}
