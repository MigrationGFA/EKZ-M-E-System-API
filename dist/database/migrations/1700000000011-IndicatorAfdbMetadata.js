"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.IndicatorAfdbMetadata_1700000000011 = void 0;
class IndicatorAfdbMetadata_1700000000011 {
    async up(queryRunner) {
        await queryRunner.query(`
      ALTER TABLE indicators
        DROP CONSTRAINT IF EXISTS indicators_code_key
    `);
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
        await queryRunner.query(`
      ALTER TABLE indicators
        DROP CONSTRAINT IF EXISTS indicators_level_check
    `);
        await queryRunner.query(`
      ALTER TABLE indicators
        ADD CONSTRAINT indicators_level_check
        CHECK (level IN ('alignment','impact','outcome','output','activity'))
    `);
        await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS indicators_code_kind_uniq
        ON indicators (code, kind)
    `);
    }
    async down(queryRunner) {
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
        await queryRunner.query(`
      ALTER TABLE indicators
        ADD CONSTRAINT indicators_code_key UNIQUE (code)
    `);
    }
}
exports.IndicatorAfdbMetadata_1700000000011 = IndicatorAfdbMetadata_1700000000011;
//# sourceMappingURL=1700000000011-IndicatorAfdbMetadata.js.map