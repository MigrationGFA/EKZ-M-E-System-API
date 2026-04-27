import { MigrationInterface, QueryRunner } from 'typeorm';

export class PasswordResetToken1700000000006 implements MigrationInterface {
  name = 'PasswordResetToken1700000000006';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "users"
        ADD COLUMN "password_reset_token" VARCHAR(64),
        ADD COLUMN "password_reset_expires" TIMESTAMPTZ
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "users"
        DROP COLUMN "password_reset_token",
        DROP COLUMN "password_reset_expires"
    `);
  }
}
