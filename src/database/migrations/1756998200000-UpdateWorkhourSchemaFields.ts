import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateWorkhourSchemaFields1756998200000 implements MigrationInterface {
    name = 'UpdateWorkhourSchemaFields1756998200000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Check if workhours table exists
        const hasTable = await queryRunner.hasTable("workhours");
        
        if (hasTable) {
            // Check and update existing table
            const hasRoleColumn = await queryRunner.hasColumn("workhours", "role");
            const hasHoursColumn = await queryRunner.hasColumn("workhours", "hours");
            const hasRoleIdColumn = await queryRunner.hasColumn("workhours", "roleId");
            const hasWorkHoursColumn = await queryRunner.hasColumn("workhours", "workHours");
            const hasStartTimeColumn = await queryRunner.hasColumn("workhours", "startTime");
            const hasEndTimeColumn = await queryRunner.hasColumn("workhours", "endTime");
            
            // Drop old columns if they exist
            if (hasRoleColumn) {
                await queryRunner.query(`ALTER TABLE "workhours" DROP COLUMN "role"`);
            }
            if (hasHoursColumn) {
                await queryRunner.query(`ALTER TABLE "workhours" DROP COLUMN "hours"`);
            }
            
            // Add new columns if they don't exist
            if (!hasRoleIdColumn) {
                await queryRunner.query(`ALTER TABLE "workhours" ADD "roleId" uuid`);
            }
            if (!hasWorkHoursColumn) {
                await queryRunner.query(`ALTER TABLE "workhours" ADD "workHours" integer NOT NULL DEFAULT 8`);
            }
            if (!hasStartTimeColumn) {
                await queryRunner.query(`ALTER TABLE "workhours" ADD "startTime" varchar(10)`);
            }
            if (!hasEndTimeColumn) {
                await queryRunner.query(`ALTER TABLE "workhours" ADD "endTime" varchar(10)`);
            }
        } else {
            // Create table with correct schema
            await queryRunner.query(`
                CREATE TABLE "workhours" (
                    "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
                    "roleId" uuid,
                    "userId" uuid,
                    "workHours" integer NOT NULL DEFAULT 8,
                    "startTime" varchar(10),
                    "endTime" varchar(10),
                    "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                    "updatedAt" TIMESTAMP NOT NULL DEFAULT now()
                )
            `);
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        const hasTable = await queryRunner.hasTable("workhours");
        
        if (hasTable) {
            // Check and revert to old schema
            const hasRoleIdColumn = await queryRunner.hasColumn("workhours", "roleId");
            const hasWorkHoursColumn = await queryRunner.hasColumn("workhours", "workHours");
            const hasStartTimeColumn = await queryRunner.hasColumn("workhours", "startTime");
            const hasEndTimeColumn = await queryRunner.hasColumn("workhours", "endTime");
            const hasRoleColumn = await queryRunner.hasColumn("workhours", "role");
            const hasHoursColumn = await queryRunner.hasColumn("workhours", "hours");
            
            // Drop new columns if they exist
            if (hasRoleIdColumn) {
                await queryRunner.query(`ALTER TABLE "workhours" DROP COLUMN "roleId"`);
            }
            if (hasWorkHoursColumn) {
                await queryRunner.query(`ALTER TABLE "workhours" DROP COLUMN "workHours"`);
            }
            if (hasStartTimeColumn) {
                await queryRunner.query(`ALTER TABLE "workhours" DROP COLUMN "startTime"`);
            }
            if (hasEndTimeColumn) {
                await queryRunner.query(`ALTER TABLE "workhours" DROP COLUMN "endTime"`);
            }
            
            // Add back old columns if they don't exist
            if (!hasRoleColumn) {
                await queryRunner.query(`ALTER TABLE "workhours" ADD "role" varchar(30)`);
            }
            if (!hasHoursColumn) {
                await queryRunner.query(`ALTER TABLE "workhours" ADD "hours" integer NOT NULL DEFAULT 8`);
            }
        }
    }
}
