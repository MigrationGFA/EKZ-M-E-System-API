"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.IndicatorYearTargets_1700000000012 = void 0;
class IndicatorYearTargets_1700000000012 {
    async up(queryRunner) {
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
    async down(queryRunner) {
        await queryRunner.query(`
      DROP TABLE IF EXISTS indicator_year_targets
    `);
    }
}
exports.IndicatorYearTargets_1700000000012 = IndicatorYearTargets_1700000000012;
//# sourceMappingURL=1700000000012-IndicatorYearTargets.js.map