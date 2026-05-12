import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Phase 9.5 hotfix — completes the indicator_year_targets PK swap that
 * `1700000000016-QprDomain` was supposed to do.
 *
 * Symptom observed in dev: after `1700000000016` was recorded as run,
 * the `is_original` + `revision_year` columns were present but the
 * `id` UUID column + PK swap + UNIQUE index were NOT, leaving the
 * entity (which declares `id` as PrimaryGeneratedColumn) incompatible
 * with the live schema. TypeORM SELECT fails every read with
 * "column indicator_year_targets.id does not exist".
 *
 * Root cause is the previous migration recording-vs-execution race;
 * mitigation is this idempotent follow-up. Safe to apply to either:
 *   - a half-applied DB (id missing, composite PK still in place), or
 *   - a fresh DB where `1700000000016` ran cleanly (everything skips).
 */
export class FixYearTargetsPk_1700000000017 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Add `id` column if not yet present.
    await queryRunner.query(`
      ALTER TABLE indicator_year_targets
        ADD COLUMN IF NOT EXISTS id UUID DEFAULT uuid_generate_v4()
    `);

    // 2. Backfill any null ids (defensive — uuid_generate_v4() should
    //    have filled new rows, but old rows may have been inserted
    //    between the column add and a later default-set).
    await queryRunner.query(`
      UPDATE indicator_year_targets
        SET id = uuid_generate_v4()
        WHERE id IS NULL
    `);

    // 3. Set id NOT NULL. ALTER COLUMN ... SET NOT NULL is idempotent
    //    in PostgreSQL only if the column ISN'T already NOT NULL —
    //    re-running fails with "column is in a primary key" or similar.
    //    Use a DO block to check first.
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

    // 4. Drop the old composite primary key (indicator_id, year) if it
    //    still exists. Use the canonical PostgreSQL constraint name.
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

    // 5. Add the new primary key on id if no PK exists yet.
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

    // 6. UNIQUE index covering (indicator_id, year, is_original) so one
    //    original + one revision can coexist per (indicator, year).
    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS iyt_indicator_year_original_uniq
        ON indicator_year_targets(indicator_id, year, is_original)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Mirrors the down() of 1700000000016 for the iyt-specific bits.
    // Deletes any revision rows so the composite PK can be restored.
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
