import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Phase 3 — Multi-year targets per indicator.
 *
 * Adds the `indicator_year_targets` table so the Monitoring Plan year columns
 * (e.g. 2023 / 2026 / 2028) can be queried as data. The pre-existing
 * `indicators.target` column continues to represent the lifetime / completion
 * target; year targets are interim milestones and are only consulted by the
 * status computation when present (see slice 2's `expectedAt` helper).
 *
 * Composite primary key (indicator_id, year) prevents duplicate-year rows
 * per indicator without a separate UNIQUE.
 *
 * See: docs/afdb-alignment/IMPLEMENTATION_PLAN.md (Phase 3)
 */
export class IndicatorYearTargets_1700000000012 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS indicator_year_targets (
        indicator_id UUID         NOT NULL REFERENCES indicators(id) ON DELETE CASCADE,
        year         INTEGER      NOT NULL,
        target_value NUMERIC      NOT NULL,
        notes        TEXT,
        created_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
        updated_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
        PRIMARY KEY (indicator_id, year)
      )
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS indicator_year_targets_year_idx
        ON indicator_year_targets (year)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP TABLE IF EXISTS indicator_year_targets
    `);
  }
}
