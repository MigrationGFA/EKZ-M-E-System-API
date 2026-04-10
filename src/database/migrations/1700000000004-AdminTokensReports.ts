import { MigrationInterface, QueryRunner } from 'typeorm';

export class AdminTokensReports1700000000004 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE api_tokens (
        id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        name         VARCHAR(255) NOT NULL,
        token_hash   VARCHAR(255) UNIQUE NOT NULL,
        token_prefix VARCHAR(50) NOT NULL,
        created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    await queryRunner.query(`
      CREATE TABLE reports (
        id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        title         VARCHAR(500) NOT NULL,
        generated_by  VARCHAR(255) NOT NULL,
        generated_at  TIMESTAMPTZ NOT NULL,
        format        VARCHAR(20) NOT NULL,
        filters       JSONB NOT NULL DEFAULT '{}',
        download_url  TEXT NOT NULL DEFAULT '#',
        created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS reports;`);
    await queryRunner.query(`DROP TABLE IF EXISTS api_tokens;`);
  }
}
