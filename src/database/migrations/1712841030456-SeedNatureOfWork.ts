import { In, MigrationInterface, QueryRunner } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';

export class SeedNatureOfWork1712841030456 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Define the default nature of work types from the old string enum
    const natureOfWorkTypes = [
      { name: 'External Audit', shortName: 'external_audit' },
      { name: 'Tax Compliance', shortName: 'tax_compliance' },
      { name: 'Accounts Review', shortName: 'accounts_review' },
      { name: 'Legal Services', shortName: 'legal_services' },
      { name: 'Financial Projection', shortName: 'financial_projection' },
      { name: 'Valuation', shortName: 'valuation' },
      { name: 'Internal Audit', shortName: 'internal_audit' },
      { name: 'Others', shortName: 'others' }
    ];

    // Check if nature of work types already exist to avoid duplicates
    const existingTypes = await queryRunner.query(`
      SELECT "shortName" FROM "nature_of_work" 
      WHERE "shortName" IN (${natureOfWorkTypes.map(t => `'${t.shortName}'`).join(',')})
    `);
    
    const existingShortNames = existingTypes.map((row: any) => row.shortName);
    
    // Insert only the types that don't already exist
    for (const type of natureOfWorkTypes) {
      if (!existingShortNames.includes(type.shortName)) {
        const id = uuidv4();
        const now = new Date().toISOString();
        
        await queryRunner.query(`
          INSERT INTO "nature_of_work" (id, "name", "shortName", "isActive", "createdAt", "updatedAt")
          VALUES ('${id}', '${type.name}', '${type.shortName}', true, '${now}', '${now}')
        `);
      }
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Define the short names to delete
    const shortNames = [
      'external_audit', 'tax_compliance', 'accounts_review', 'legal_services',
      'financial_projection', 'valuation', 'internal_audit', 'others'
    ];
    
    // Delete the default nature of work entries
    await queryRunner.query(`
      DELETE FROM "nature_of_work" 
      WHERE "shortName" IN (${shortNames.map(name => `'${name}'`).join(',')})
    `);
  }
}
