import {MigrationInterface, QueryRunner} from "typeorm";

export class AddOverrideTrackingToLeaves1756829806090 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "leaves" 
            ADD COLUMN "overriddenBy" uuid,
            ADD COLUMN "overriddenAt" timestamp
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "leaves" 
            DROP COLUMN "overriddenBy",
            DROP COLUMN "overriddenAt"
        `);
    }

}
