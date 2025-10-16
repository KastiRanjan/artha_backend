import { MigrationInterface, QueryRunner } from "typeorm";

export class AddNotificationType1757000000000 implements MigrationInterface {
    name = 'AddNotificationType1757000000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Check if notification table exists
        const hasTable = await queryRunner.hasTable("notification");
        
        if (hasTable) {
            // Check if type column exists and is nullable
            const hasTypeColumn = await queryRunner.hasColumn("notification", "type");
            
            if (hasTypeColumn) {
                // Update existing NULL values to 'general' before changing schema
                await queryRunner.query(`
                    UPDATE "notification" 
                    SET "type" = 'general' 
                    WHERE "type" IS NULL
                `);
                
                // Alter column to be NOT NULL with default value
                await queryRunner.query(`
                    ALTER TABLE "notification" 
                    ALTER COLUMN "type" SET DEFAULT 'general'
                `);
                
                await queryRunner.query(`
                    ALTER TABLE "notification" 
                    ALTER COLUMN "type" SET NOT NULL
                `);
            } else {
                // If type column doesn't exist, create it
                await queryRunner.query(`
                    ALTER TABLE "notification" 
                    ADD COLUMN "type" varchar(50) NOT NULL DEFAULT 'general'
                `);
            }
            
            // Create an index on type column for better query performance
            const hasIndex = await queryRunner.query(`
                SELECT indexname 
                FROM pg_indexes 
                WHERE tablename = 'notification' 
                AND indexname = 'IDX_notification_type'
            `);
            
            if (hasIndex.length === 0) {
                await queryRunner.query(`
                    CREATE INDEX "IDX_notification_type" 
                    ON "notification" ("type")
                `);
            }
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Check if notification table exists
        const hasTable = await queryRunner.hasTable("notification");
        
        if (hasTable) {
            // Drop the index
            const hasIndex = await queryRunner.query(`
                SELECT indexname 
                FROM pg_indexes 
                WHERE tablename = 'notification' 
                AND indexname = 'IDX_notification_type'
            `);
            
            if (hasIndex.length > 0) {
                await queryRunner.query(`
                    DROP INDEX "IDX_notification_type"
                `);
            }
            
            // Make type column nullable again
            await queryRunner.query(`
                ALTER TABLE "notification" 
                ALTER COLUMN "type" DROP NOT NULL
            `);
            
            // Remove default value
            await queryRunner.query(`
                ALTER TABLE "notification" 
                ALTER COLUMN "type" DROP DEFAULT
            `);
        }
    }
}
