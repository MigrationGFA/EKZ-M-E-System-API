import { MigrationInterface, QueryRunner } from 'typeorm';

export class UserDefaultPasswordFlag1700000000005
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE users
      ADD COLUMN is_default_password BOOLEAN NOT NULL DEFAULT false;
    `);

    // Backfill: all existing users were created with the hardcoded temp password
    await queryRunner.query(`
      UPDATE users SET is_default_password = true;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE users DROP COLUMN is_default_password;
    `);
  }
}
