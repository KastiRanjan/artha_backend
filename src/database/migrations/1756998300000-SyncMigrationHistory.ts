import { MigrationInterface, QueryRunner } from "typeorm";

export class SyncMigrationHistory1756998300000 implements MigrationInterface {
    name = 'SyncMigrationHistory1756998300000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // This migration will sync the migration history without running conflicting migrations
        
        // Insert migration records for already existing schema
        const migrations = [
            { id: 2, timestamp: '1737195680588', name: 'into1730997426192' },
            { id: 3, timestamp: '1742142784312', name: 'UpdateYourEntity1742142784312' },
            { id: 4, timestamp: '1756829806090', name: 'AddOverrideTrackingToLeaves1756829806090' }
        ];

        // Check if migrations table exists and insert missing migration records
        for (const migration of migrations) {
            const exists = await queryRunner.query(
                `SELECT 1 FROM migrations WHERE "name" = $1`,
                [migration.name]
            );
            
            if (exists.length === 0) {
                await queryRunner.query(
                    `INSERT INTO migrations ("id", "timestamp", "name") VALUES ($1, $2, $3)`,
                    [migration.id, migration.timestamp, migration.name]
                );
            }
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Remove the migration records we just added
        const migrationNames = [
            'into1730997426192',
            'UpdateYourEntity1742142784312', 
            'AddOverrideTrackingToLeaves1756829806090'
        ];

        for (const name of migrationNames) {
            await queryRunner.query(`DELETE FROM migrations WHERE "name" = $1`, [name]);
        }
    }
}
