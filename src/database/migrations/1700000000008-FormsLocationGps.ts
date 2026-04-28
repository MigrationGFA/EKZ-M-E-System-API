import { MigrationInterface, QueryRunner } from 'typeorm';

export class FormsLocationGps1700000000008 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE forms
        ADD COLUMN IF NOT EXISTS location_ids UUID[] NOT NULL DEFAULT '{}',
        ADD COLUMN IF NOT EXISTS require_gps   BOOLEAN NOT NULL DEFAULT false
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE forms
        DROP COLUMN IF EXISTS location_ids,
        DROP COLUMN IF EXISTS require_gps
    `);
  }
}
