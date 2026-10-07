"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FixYearTargetsPk_1700000000017 = void 0;
class FixYearTargetsPk_1700000000017 {
    async up(queryRunner) {
        await queryRunner.query(`
      ALTER TABLE indicator_year_targets
        ADD COLUMN IF NOT EXISTS id UUID DEFAULT uuid_generate_v4()
    `);
        await queryRunner.query(`
      UPDATE indicator_year_targets
        SET id = uuid_generate_v4()
        WHERE id IS NULL
    `);
        await queryRunner.query(`
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1
          FROM information_schema.columns
          WHERE table_name = 'indicator_year_targets'
            AND column_name = 'id'
            AND is_nullable = 'YES'
        ) THEN
          ALTER TABLE indicator_year_targets ALTER COLUMN id SET NOT NULL;
        END IF;
      END
      $$
    `);
        await queryRunner.query(`
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1
          FROM pg_constraint c
          JOIN pg_class t ON t.oid = c.conrelid
          WHERE t.relname = 'indicator_year_targets'
            AND c.contype = 'p'
            AND pg_get_constraintdef(c.oid) ILIKE '%indicator_id%year%'
        ) THEN
          ALTER TABLE indicator_year_targets
            DROP CONSTRAINT IF EXISTS indicator_year_targets_pkey;
        END IF;
      END
      $$
    `);
        await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1
          FROM pg_constraint c
          JOIN pg_class t ON t.oid = c.conrelid
          WHERE t.relname = 'indicator_year_targets'
            AND c.contype = 'p'
        ) THEN
          ALTER TABLE indicator_year_targets ADD PRIMARY KEY (id);
        END IF;
      END
      $$
    `);
        await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS iyt_indicator_year_original_uniq
        ON indicator_year_targets(indicator_id, year, is_original)
    `);
    }
    async down(queryRunner) {
        await queryRunner.query(`
      DROP INDEX IF EXISTS iyt_indicator_year_original_uniq
    `);
        await queryRunner.query(`
      DELETE FROM indicator_year_targets WHERE is_original = false
    `);
        await queryRunner.query(`
      ALTER TABLE indicator_year_targets
        DROP CONSTRAINT IF EXISTS indicator_year_targets_pkey
    `);
        await queryRunner.query(`
      ALTER TABLE indicator_year_targets
        ADD PRIMARY KEY (indicator_id, year)
    `);
        await queryRunner.query(`
      ALTER TABLE indicator_year_targets DROP COLUMN IF EXISTS id
    `);
    }
}
exports.FixYearTargetsPk_1700000000017 = FixYearTargetsPk_1700000000017;
//# sourceMappingURL=1700000000017-FixYearTargetsPk.js.map