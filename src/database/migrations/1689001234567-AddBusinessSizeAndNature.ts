import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddBusinessSizeAndNature1689001234567 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create BusinessSize table
    await queryRunner.query(`
      CREATE TABLE "business_size" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "createdBy" character varying,
        "updatedBy" character varying,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        "name" character varying(100) NOT NULL,
        "shortName" character varying(20) NOT NULL,
        "isActive" boolean NOT NULL DEFAULT true,
        CONSTRAINT "PK_business_size" PRIMARY KEY ("id")
      )
    `);

    // Create BusinessNature table
    await queryRunner.query(`
      CREATE TABLE "business_nature" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "createdBy" character varying,
        "updatedBy" character varying,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        "name" character varying(100) NOT NULL,
        "shortName" character varying(20) NOT NULL,
        "isActive" boolean NOT NULL DEFAULT true,
        CONSTRAINT "PK_business_nature" PRIMARY KEY ("id")
      )
    `);

    // Rename existing columns in customer table to prepare for the new relationship columns
    await queryRunner.query(`
      ALTER TABLE "customer" 
      RENAME COLUMN "businessSize" TO "businessSizeEnum"
    `);

    await queryRunner.query(`
      ALTER TABLE "customer" 
      RENAME COLUMN "industryNature" TO "industryNatureEnum"
    `);

    // Add new columns for the foreign key relationships
    await queryRunner.query(`
      ALTER TABLE "customer" 
      ADD "businessSizeId" uuid
    `);

    await queryRunner.query(`
      ALTER TABLE "customer" 
      ADD "industryNatureId" uuid
    `);

    // Create foreign key constraints
    await queryRunner.query(`
      ALTER TABLE "customer" 
      ADD CONSTRAINT "FK_customer_businessSize" 
      FOREIGN KEY ("businessSizeId") REFERENCES "business_size"("id") 
      ON DELETE SET NULL ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      ALTER TABLE "customer" 
      ADD CONSTRAINT "FK_customer_industryNature" 
      FOREIGN KEY ("industryNatureId") REFERENCES "business_nature"("id") 
      ON DELETE SET NULL ON UPDATE NO ACTION
    `);

    // Seed initial business size data based on the enum values
    await queryRunner.query(`
      INSERT INTO "business_size" ("name", "shortName", "isActive")
      VALUES 
        ('Micro', 'micro', true),
        ('Cottage', 'cottage', true),
        ('Small', 'small', true),
        ('Medium', 'medium', true),
        ('Large', 'large', true),
        ('Not Applicable', 'not_applicable', true)
    `);

    // Seed initial business nature data based on the enum values
    await queryRunner.query(`
      INSERT INTO "business_nature" ("name", "shortName", "isActive")
      VALUES 
        ('Banking & Finance', 'banking_finance', true),
        ('Capital Market & Broking', 'capital_market_broking', true),
        ('Insurance', 'insurance', true),
        ('Energy, Mining & Mineral', 'energy_mining_mineral', true),
        ('Manufacturing', 'manufacturing', true),
        ('Agriculture & Forestry', 'agriculture_forestry', true),
        ('Construction & Real Estate', 'construction_real_estate', true),
        ('Travel & Tourism', 'travel_tourism', true),
        ('Research & Development', 'research_development', true),
        ('Transportation & Logistics Management', 'transportation_logistics_management', true),
        ('Information Transmission & Communication', 'information_transmission_communication', true),
        ('Aviation', 'aviation', true),
        ('Computer & Electronics', 'computer_electronics', true),
        ('Trading of Goods', 'trading_of_goods', true),
        ('Personal Service', 'personal_service', true),
        ('Business Related Service', 'business_related_service', true),
        ('Others', 'others', true)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remove foreign key constraints
    await queryRunner.query(`
      ALTER TABLE "customer" DROP CONSTRAINT "FK_customer_industryNature"
    `);

    await queryRunner.query(`
      ALTER TABLE "customer" DROP CONSTRAINT "FK_customer_businessSize"
    `);

    // Remove the new columns
    await queryRunner.query(`
      ALTER TABLE "customer" DROP COLUMN "industryNatureId"
    `);

    await queryRunner.query(`
      ALTER TABLE "customer" DROP COLUMN "businessSizeId"
    `);

    // Rename columns back to original
    await queryRunner.query(`
      ALTER TABLE "customer" 
      RENAME COLUMN "industryNatureEnum" TO "industryNature"
    `);

    await queryRunner.query(`
      ALTER TABLE "customer" 
      RENAME COLUMN "businessSizeEnum" TO "businessSize"
    `);

    // Drop the new tables
    await queryRunner.query(`DROP TABLE "business_nature"`);
    await queryRunner.query(`DROP TABLE "business_size"`);
  }
}
