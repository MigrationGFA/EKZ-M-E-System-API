import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Phase 2 — AfDB-aligned indicator metadata.
 *
 * Brings the `indicators` table up to the Monitoring Plan column set:
 *   - `kind` discriminator (alignment / outcome / output / activity) replaces
 *     the old single-axis `level` for uniqueness purposes
 *   - composite UNIQUE on (code, kind) lets Outcome 1.1 and Output 1.1 coexist
 *     (the previous UNIQUE on `code` alone is dropped)
 *   - methodology, RMF/ADoA flag, target_mode, data_source_type per indicator
 *   - reporting window bounds for indicators that don't run the full project
 *   - widened `frequency` CHECK to add `mid_term` and `one_off`
 *   - widened `level` CHECK to add `alignment` and `activity`
 *
 * The pre-existing `level` column is retained as a backward-compat hint; the
 * new `kind` column is the AfDB-vocabulary discriminator going forward.
 *
 * See: docs/afdb-alignment/IMPLEMENTATION_PLAN.md (Phase 2)
 *      docs/afdb-alignment/decisions/0004-frequency-and-cadence.md
 */
export class IndicatorAfdbMetadata_1700000000011
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Drop the single-column UNIQUE on `code`. The composite (code, kind)
    // unique index added below replaces it.
    await queryRunner.query(`
      ALTER TABLE indicators
        DROP CONSTRAINT IF EXISTS indicators_code_key
    `);

    // Additive columns. NOT NULL columns get DB defaults so existing rows
    // remain valid; nullable columns stay NULL.
    await queryRunner.query(`
      ALTER TABLE indicators
        ADD COLUMN IF NOT EXISTS kind                 VARCHAR(30)  NOT NULL DEFAULT 'output',
        ADD COLUMN IF NOT EXISTS methodology          TEXT,
        ADD COLUMN IF NOT EXISTS rmf_adoa             BOOLEAN      NOT NULL DEFAULT false,
        ADD COLUMN IF NOT EXISTS target_mode          VARCHAR(20)  NOT NULL DEFAULT 'cumulative',
        ADD COLUMN IF NOT EXISTS data_source_type     VARCHAR(30)  NOT NULL DEFAULT 'form_submission',
        ADD COLUMN IF NOT EXISTS reporting_year_start INTEGER,
        ADD COLUMN IF NOT EXISTS reporting_year_end   INTEGER
    `);

    // Named CHECK constraints for the three new enum-style columns.
    await queryRunner.query(`
      ALTER TABLE indicators
        DROP CONSTRAINT IF EXISTS indicators_kind_check
    `);
    await queryRunner.query(`
      ALTER TABLE indicators
        ADD CONSTRAINT indicators_kind_check
        CHECK (kind IN ('alignment','outcome','output','activity'))
    `);

    await queryRunner.query(`
      ALTER TABLE indicators
        DROP CONSTRAINT IF EXISTS indicators_target_mode_check
    `);
    await queryRunner.query(`
      ALTER TABLE indicators
        ADD CONSTRAINT indicators_target_mode_check
        CHECK (target_mode IN ('cumulative','incremental','binary'))
    `);

    await queryRunner.query(`
      ALTER TABLE indicators
        DROP CONSTRAINT IF EXISTS indicators_data_source_type_check
    `);
    await queryRunner.query(`
      ALTER TABLE indicators
        ADD CONSTRAINT indicators_data_source_type_check
        CHECK (data_source_type IN (
          'form_submission',
          'tracer_study',
          'contractor_report',
          'financial_statement',
          'policy_document',
          'external_feed',
          'manual'
        ))
    `);

    // Widen the existing frequency CHECK to allow mid_term + one_off.
    await queryRunner.query(`
      ALTER TABLE indicators
        DROP CONSTRAINT IF EXISTS indicators_frequency_check
    `);
    await queryRunner.query(`
      ALTER TABLE indicators
        ADD CONSTRAINT indicators_frequency_check
        CHECK (frequency IN (
          'monthly',
          'quarterly',
          'bi_annually',
          'annually',
          'mid_term',
          'one_off'
        ))
    `);

    // Widen the existing level CHECK to accept the new AfDB vocabulary
    // (alignment, activity). Existing values (impact, outcome, output) all
    // remain valid.
    await queryRunner.query(`
      ALTER TABLE indicators
        DROP CONSTRAINT IF EXISTS indicators_level_check
    `);
    await queryRunner.query(`
      ALTER TABLE indicators
        ADD CONSTRAINT indicators_level_check
        CHECK (level IN ('alignment','impact','outcome','output','activity'))
    `);

    // Composite uniqueness so Outcome 1.1 and Output 1.1 can coexist.
    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS indicators_code_kind_uniq
        ON indicators (code, kind)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP INDEX IF EXISTS indicators_code_kind_uniq
    `);

    await queryRunner.query(`
      ALTER TABLE indicators
        DROP CONSTRAINT IF EXISTS indicators_level_check
    `);
    await queryRunner.query(`
      ALTER TABLE indicators
        ADD CONSTRAINT indicators_level_check
        CHECK (level IN ('impact','outcome','output'))
    `);

    await queryRunner.query(`
      ALTER TABLE indicators
        DROP CONSTRAINT IF EXISTS indicators_frequency_check
    `);
    await queryRunner.query(`
      ALTER TABLE indicators
        ADD CONSTRAINT indicators_frequency_check
        CHECK (frequency IN ('monthly','quarterly','bi_annually','annually'))
    `);

    await queryRunner.query(`
      ALTER TABLE indicators
        DROP CONSTRAINT IF EXISTS indicators_data_source_type_check
    `);
    await queryRunner.query(`
      ALTER TABLE indicators
        DROP CONSTRAINT IF EXISTS indicators_target_mode_check
    `);
    await queryRunner.query(`
      ALTER TABLE indicators
        DROP CONSTRAINT IF EXISTS indicators_kind_check
    `);

    await queryRunner.query(`
      ALTER TABLE indicators
        DROP COLUMN IF EXISTS reporting_year_end,
        DROP COLUMN IF EXISTS reporting_year_start,
        DROP COLUMN IF EXISTS data_source_type,
        DROP COLUMN IF EXISTS target_mode,
        DROP COLUMN IF EXISTS rmf_adoa,
        DROP COLUMN IF EXISTS methodology,
        DROP COLUMN IF EXISTS kind
    `);

    // Restore the original single-column UNIQUE on `code`. If duplicate
    // codes exist across kinds (the very thing this migration enabled),
    // this will fail — that is intentional: down is for clean rollback.
    await queryRunner.query(`
      ALTER TABLE indicators
        ADD CONSTRAINT indicators_code_key UNIQUE (code)
    `);
  }
}
