import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Phase 4 — Disaggregation as First-Class.
 *
 * Adds two tables so indicator targets like "40% female" and "70% youth" can
 * be expressed as machine-readable rules, and each progress entry can carry
 * a per-axis breakdown the rollup endpoint aggregates over time.
 *
 *  - `indicator_disaggregations`: one row per (indicator, axis) rule.
 *    `breakdown_target` JSONB shape depends on axis (ratio for
 *    sex/age_band/skill_level; absolute count for cohort) — semantic
 *    validation lives in the service layer.
 *  - `indicator_progress_breakdowns`: one row per (progress entry, axis).
 *    Composite PK prevents duplicate-axis rows per progress without a
 *    separate UNIQUE.
 *
 * Axis vocabulary is constrained at the DB layer to the six values defined
 * by Phase 0 ADR 0003 (cohort catalogue) and the Phase 4 plan.
 *
 * See: docs/afdb-alignment/IMPLEMENTATION_PLAN.md (Phase 4)
 *      docs/afdb-alignment/decisions/0003-cohort-catalogue.md
 */
export class IndicatorDisaggregation_1700000000013 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS indicator_disaggregations (
        id               UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
        indicator_id     UUID         NOT NULL REFERENCES indicators(id) ON DELETE CASCADE,
        axis             VARCHAR(40)  NOT NULL,
        required         BOOLEAN      NOT NULL DEFAULT TRUE,
        breakdown_target JSONB,
        notes            TEXT,
        created_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
        updated_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
        CONSTRAINT indicator_disaggregations_axis_chk
          CHECK (axis IN (
            'sex','age_band','cohort','skill_level','geography','university_origin'
          )),
        CONSTRAINT indicator_disaggregations_indicator_axis_uq
          UNIQUE (indicator_id, axis)
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS indicator_progress_breakdowns (
        progress_id     UUID         NOT NULL REFERENCES indicator_progress(id) ON DELETE CASCADE,
        axis            VARCHAR(40)  NOT NULL,
        value_breakdown JSONB        NOT NULL,
        created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
        CONSTRAINT indicator_progress_breakdowns_axis_chk
          CHECK (axis IN (
            'sex','age_band','cohort','skill_level','geography','university_origin'
          )),
        PRIMARY KEY (progress_id, axis)
      )
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS indicator_progress_breakdowns_axis_idx
        ON indicator_progress_breakdowns (axis)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP TABLE IF EXISTS indicator_progress_breakdowns
    `);
    await queryRunner.query(`
      DROP TABLE IF EXISTS indicator_disaggregations
    `);
  }
}
