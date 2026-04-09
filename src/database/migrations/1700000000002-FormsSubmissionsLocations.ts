import { MigrationInterface, QueryRunner } from 'typeorm';

export class FormsSubmissionsLocations1700000000002 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE forms (
        id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        title         VARCHAR(500) NOT NULL,
        description   TEXT NOT NULL DEFAULT '',
        fields        JSONB NOT NULL DEFAULT '[]',
        indicator_ids UUID[] NOT NULL DEFAULT '{}',
        assigned_to   UUID[] NOT NULL DEFAULT '{}',
        created_by    UUID NOT NULL REFERENCES users(id),
        status        VARCHAR(20) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','published')),
        created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    await queryRunner.query(`
      CREATE TABLE project_locations (
        id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        name          VARCHAR(255) NOT NULL,
        sector        VARCHAR(100) NOT NULL,
        description   TEXT,
        lat           DOUBLE PRECISION NOT NULL,
        lng           DOUBLE PRECISION NOT NULL,
        radius_m      INTEGER NOT NULL DEFAULT 500,
        indicator_ids UUID[] NOT NULL DEFAULT '{}',
        created_by    UUID NOT NULL REFERENCES users(id),
        created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    await queryRunner.query(`
      CREATE TABLE submissions (
        id                 UUID PRIMARY KEY,
        form_id            UUID NOT NULL REFERENCES forms(id),
        officer_id         UUID NOT NULL REFERENCES users(id),
        data               JSONB NOT NULL,
        location           JSONB,
        location_id        UUID REFERENCES project_locations(id),
        on_site            BOOLEAN,
        submitted_at       TIMESTAMPTZ NOT NULL,
        validation_status  VARCHAR(20) NOT NULL DEFAULT 'pending'
          CHECK (validation_status IN ('pending','approved','rejected')),
        validation_comment TEXT,
        synced_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS submissions;`);
    await queryRunner.query(`DROP TABLE IF EXISTS project_locations;`);
    await queryRunner.query(`DROP TABLE IF EXISTS forms;`);
  }
}
