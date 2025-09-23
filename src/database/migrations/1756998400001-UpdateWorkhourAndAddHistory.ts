import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateWorkhourAndAddHistory1756998400001 implements MigrationInterface {
    name = 'UpdateWorkhourAndAddHistory1756998400001'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Check if workhour_history table exists
        const hasHistoryTable = await queryRunner.hasTable("workhour_history");
        
        if (!hasHistoryTable) {
            // Create workhour_history table
            await queryRunner.query(`
                CREATE TABLE "workhour_history" (
                    "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
                    "roleId" uuid NOT NULL,
                    "previousWorkHourId" uuid,
                    "workHours" integer NOT NULL DEFAULT 8,
                    "startTime" varchar(10),
                    "endTime" varchar(10),
                    "validFrom" date NOT NULL,
                    "validUntil" date,
                    "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                    "updatedAt" TIMESTAMP NOT NULL DEFAULT now()
                )
            `);
        }

        // Update workhours table
        const hasTable = await queryRunner.hasTable("workhours");
        
        if (hasTable) {
            // Make roleId not nullable
            await queryRunner.query(`ALTER TABLE "workhours" ALTER COLUMN "roleId" SET NOT NULL`);
            
            // Set validFrom as not nullable
            await queryRunner.query(`ALTER TABLE "workhours" ALTER COLUMN "validFrom" SET NOT NULL`);
            
            // Check and drop validTo column if it exists
            const hasValidToColumn = await queryRunner.hasColumn("workhours", "validTo");
            if (hasValidToColumn) {
                await queryRunner.query(`ALTER TABLE "workhours" DROP COLUMN "validTo"`);
            }
            
            // Check and drop userId column if it exists
            const hasUserIdColumn = await queryRunner.hasColumn("workhours", "userId");
            if (hasUserIdColumn) {
                await queryRunner.query(`ALTER TABLE "workhours" DROP COLUMN "userId"`);
            }
            
            // Add isActive column if it doesn't exist
            const hasIsActiveColumn = await queryRunner.hasColumn("workhours", "isActive");
            if (!hasIsActiveColumn) {
                await queryRunner.query(`ALTER TABLE "workhours" ADD "isActive" boolean NOT NULL DEFAULT true`);
            }
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Restore workhours table to previous state
        const hasTable = await queryRunner.hasTable("workhours");
        
        if (hasTable) {
            // Make roleId nullable again
            await queryRunner.query(`ALTER TABLE "workhours" ALTER COLUMN "roleId" DROP NOT NULL`);
            
            // Make validFrom nullable again
            await queryRunner.query(`ALTER TABLE "workhours" ALTER COLUMN "validFrom" DROP NOT NULL`);
            
            // Add back validTo column if it doesn't exist
            const hasValidToColumn = await queryRunner.hasColumn("workhours", "validTo");
            if (!hasValidToColumn) {
                await queryRunner.query(`ALTER TABLE "workhours" ADD "validTo" date`);
            }
            
            // Add back userId column if it doesn't exist
            const hasUserIdColumn = await queryRunner.hasColumn("workhours", "userId");
            if (!hasUserIdColumn) {
                await queryRunner.query(`ALTER TABLE "workhours" ADD "userId" uuid`);
            }
            
            // Drop isActive column if it exists
            const hasIsActiveColumn = await queryRunner.hasColumn("workhours", "isActive");
            if (hasIsActiveColumn) {
                await queryRunner.query(`ALTER TABLE "workhours" DROP COLUMN "isActive"`);
            }
        }
        
        // Drop workhour_history table if it exists
        const hasHistoryTable = await queryRunner.hasTable("workhour_history");
        if (hasHistoryTable) {
            await queryRunner.query(`DROP TABLE "workhour_history"`);
        }
    }
}