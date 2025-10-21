import { MigrationInterface, QueryRunner, Table } from "typeorm";

export class CreateMailSettingsTable1757001000000 implements MigrationInterface {
    name = 'CreateMailSettingsTable1757001000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Check if mail_settings table already exists
        const hasTable = await queryRunner.hasTable("mail_settings");
        
        if (!hasTable) {
            await queryRunner.createTable(
                new Table({
                    name: "mail_settings",
                    columns: [
                        {
                            name: "id",
                            type: "int",
                            isPrimary: true,
                            isGenerated: true,
                            generationStrategy: "increment",
                        },
                        {
                            name: "enabled",
                            type: "boolean",
                            default: true,
                        },
                        {
                            name: "clockInRemindersEnabled",
                            type: "boolean",
                            default: true,
                        },
                        {
                            name: "clockOutRemindersEnabled",
                            type: "boolean",
                            default: true,
                        },
                        {
                            name: "gracePeriodMinutes",
                            type: "int",
                            default: 60,
                        },
                        {
                            name: "cronSchedule",
                            type: "varchar",
                            length: "50",
                            default: "'*/15 * * * *'",
                        },
                        {
                            name: "excludedRoles",
                            type: "text",
                            isArray: true,
                            default: "ARRAY['super_user', 'admin']",
                        },
                        {
                            name: "createdAt",
                            type: "timestamp",
                            default: "now()",
                        },
                        {
                            name: "updatedAt",
                            type: "timestamp",
                            default: "now()",
                        },
                    ],
                }),
                true
            );

            // Create default settings record
            await queryRunner.query(`
                INSERT INTO "mail_settings" (
                    "enabled",
                    "clockInRemindersEnabled", 
                    "clockOutRemindersEnabled",
                    "gracePeriodMinutes",
                    "cronSchedule",
                    "excludedRoles"
                ) VALUES (
                    true,
                    true,
                    true,
                    60,
                    '*/15 * * * *',
                    ARRAY['super_user', 'admin']
                )
            `);
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Check if mail_settings table exists before dropping
        const hasTable = await queryRunner.hasTable("mail_settings");
        
        if (hasTable) {
            await queryRunner.dropTable("mail_settings");
        }
    }
}
