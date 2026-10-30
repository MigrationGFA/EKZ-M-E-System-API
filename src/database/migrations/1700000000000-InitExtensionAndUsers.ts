import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitExtensionAndUsers1700000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {



    await queryRunner.query(
      `\n      CREATE TABLE users (\n        id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),\n        email         VARCHAR(255) UNIQUE NOT NULL,\n        name          VARCHAR(255) NOT NULL,\n        password_hash VARCHAR(255) NOT NULL,\n        role          VARCHAR(50) NOT NULL CHECK (role IN ('admin','me_staff','programme_staff','viewer')),\n        avatar        TEXT,\n        active        BOOLEAN NOT NULL DEFAULT true,\n        last_login    TIMESTAMPTZ,\n        created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),\n        updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()\n      );\n    `,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS users;`);
  }
}
