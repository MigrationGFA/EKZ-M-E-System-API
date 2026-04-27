import { MigrationInterface, QueryRunner } from 'typeorm';

export class FormFieldMappings1700000000007 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE forms
        ADD COLUMN IF NOT EXISTS field_mappings JSONB NOT NULL DEFAULT '[]'
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE forms DROP COLUMN IF EXISTS field_mappings
    `);
  }
}
