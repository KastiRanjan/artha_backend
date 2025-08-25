import {MigrationInterface, QueryRunner} from "typeorm";

export class UpdateYourEntity1742142784312 implements MigrationInterface {
    name = 'UpdateYourEntity1742142784312'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "attendance_history" DROP COLUMN "clockOut"`);
        await queryRunner.query(`ALTER TABLE "attendance_history" ADD "clockOut" character varying NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "attendance_history" DROP COLUMN "clockOut"`);
        await queryRunner.query(`ALTER TABLE "attendance_history" ADD "clockOut" date NOT NULL`);
    }

}
