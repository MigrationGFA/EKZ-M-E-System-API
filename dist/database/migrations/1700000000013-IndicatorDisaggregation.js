"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.IndicatorDisaggregation_1700000000013 = void 0;
class IndicatorDisaggregation_1700000000013 {
    async up(queryRunner) {
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
    async down(queryRunner) {
        await queryRunner.query(`
      DROP TABLE IF EXISTS indicator_progress_breakdowns
    `);
        await queryRunner.query(`
      DROP TABLE IF EXISTS indicator_disaggregations
    `);
    }
}
exports.IndicatorDisaggregation_1700000000013 = IndicatorDisaggregation_1700000000013;
//# sourceMappingURL=1700000000013-IndicatorDisaggregation.js.map