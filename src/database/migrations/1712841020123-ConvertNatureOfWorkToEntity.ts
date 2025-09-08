import { MigrationInterface, QueryRunner } from 'typeorm';

export class ConvertNatureOfWorkToEntity1712841020123 implements MigrationInterface {
  // Convert existing string nature of work values to entity relationships
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create temporary column for storing the original values
    await queryRunner.query(`ALTER TABLE "project" ADD "oldNatureOfWork" varchar(30)`);
    
    // Copy values from natureOfWork to the temporary column
    await queryRunner.query(`UPDATE "project" SET "oldNatureOfWork" = "natureOfWork"`);
    
    // Drop the old natureOfWork column
    await queryRunner.query(`ALTER TABLE "project" DROP COLUMN "natureOfWork"`);
    
    // Create the new column as a foreign key
    await queryRunner.query(`ALTER TABLE "project" ADD "natureOfWorkId" uuid`);
    
    // Add foreign key constraint
    await queryRunner.query(`ALTER TABLE "project" ADD CONSTRAINT "FK_project_nature_of_work" 
      FOREIGN KEY ("natureOfWorkId") REFERENCES "nature_of_work"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
    
    // Migrate data:
    // For each project, find the corresponding nature of work by name and set the relationship
    // This depends on having pre-populated the nature_of_work table with the appropriate values
    // You'll need to make sure these values exist in the nature_of_work table
    
    // Create a function to migrate each project
    await queryRunner.query(`
    DO $$
    DECLARE
      p RECORD;
      nature_id uuid;
    BEGIN
      FOR p IN SELECT id, "oldNatureOfWork" FROM "project" WHERE "oldNatureOfWork" IS NOT NULL LOOP
        -- Try to find a matching nature of work by shortName (assuming shortName matches the string values)
        SELECT id INTO nature_id FROM "nature_of_work" 
        WHERE LOWER("shortName") = LOWER(REPLACE(p."oldNatureOfWork", '_', ' ')) LIMIT 1;
        
        -- If not found by shortName, try to match by name
        IF nature_id IS NULL THEN
          SELECT id INTO nature_id FROM "nature_of_work" 
          WHERE LOWER("name") LIKE '%' || LOWER(REPLACE(p."oldNatureOfWork", '_', ' ')) || '%' LIMIT 1;
        END IF;
        
        -- Update the project with the found nature of work id
        IF nature_id IS NOT NULL THEN
          UPDATE "project" SET "natureOfWorkId" = nature_id WHERE id = p.id;
        END IF;
      END LOOP;
    END $$;
    `);
    
    // Drop the temporary column
    await queryRunner.query(`ALTER TABLE "project" DROP COLUMN "oldNatureOfWork"`);
  }

  // Revert changes
  public async down(queryRunner: QueryRunner): Promise<void> {
    // Add the old column back
    await queryRunner.query(`ALTER TABLE "project" ADD "oldNatureOfWork" varchar(30)`);
    
    // Copy the text values back
    await queryRunner.query(`
    UPDATE "project" p
    SET "oldNatureOfWork" = CASE
      WHEN EXISTS (SELECT 1 FROM "nature_of_work" n WHERE n.id = p."natureOfWorkId") THEN
        (SELECT REPLACE(LOWER(n."shortName"), ' ', '_') FROM "nature_of_work" n WHERE n.id = p."natureOfWorkId")
      ELSE 'others'
    END
    `);
    
    // Drop the foreign key constraint
    await queryRunner.query(`ALTER TABLE "project" DROP CONSTRAINT "FK_project_nature_of_work"`);
    
    // Drop the entity relationship column
    await queryRunner.query(`ALTER TABLE "project" DROP COLUMN "natureOfWorkId"`);
    
    // Rename the old column back to the original name
    await queryRunner.query(`ALTER TABLE "project" RENAME COLUMN "oldNatureOfWork" TO "natureOfWork"`);
  }
}
