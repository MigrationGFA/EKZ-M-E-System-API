import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Phase 1 — AfDB-aligned logframe hierarchy.
 *
 * Widens logframe_nodes.type to support the AfDB Results-Based Management
 * structure (PDO → outcomes/components → output statements). Legacy values
 * (goal/outcome/output/activity) are retained so existing dev data survives.
 *
 * Adds optional budget fields (used by component nodes — see ADR 0002) and
 * a single-row project_meta table holding baseline / midpoint / completion
 * dates referenced by the scheduler and reports.
 *
 * See: docs/afdb-alignment/decisions/0002-hierarchy.md
 */
export class LogframeHierarchyV2_1700000000010
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE logframe_nodes
        DROP CONSTRAINT IF EXISTS logframe_nodes_type_check
    `);

    await queryRunner.query(`
      ALTER TABLE logframe_nodes
        ADD CONSTRAINT logframe_nodes_type_check
        CHECK (type IN (
          'pdo',
          'alignment',
          'component',
          'outcome_statement',
          'output_statement',
          'goal',
          'outcome',
          'output',
          'activity'
        ))
    `);

    await queryRunner.query(`
      ALTER TABLE logframe_nodes
        ADD COLUMN IF NOT EXISTS budget_usd      NUMERIC,
        ADD COLUMN IF NOT EXISTS budget_currency VARCHAR(10) DEFAULT 'USD'
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS project_meta (
        id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        name            VARCHAR(255) NOT NULL,
        sap_code        VARCHAR(50),
        pdo_text        TEXT NOT NULL,
        baseline_year   INTEGER NOT NULL,
        completion_year INTEGER NOT NULL,
        midpoint_date   DATE,
        pdo_node_id     UUID REFERENCES logframe_nodes(id) ON DELETE SET NULL,
        created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS project_meta`);

    await queryRunner.query(`
      ALTER TABLE logframe_nodes
        DROP COLUMN IF EXISTS budget_usd,
        DROP COLUMN IF EXISTS budget_currency
    `);

    await queryRunner.query(`
      ALTER TABLE logframe_nodes
        DROP CONSTRAINT IF EXISTS logframe_nodes_type_check
    `);

    // Restore the original narrow CHECK. If new-vocab rows exist this will
    // fail — that is intentional: down is for clean rollback only.
    await queryRunner.query(`
      ALTER TABLE logframe_nodes
        ADD CONSTRAINT logframe_nodes_type_check
        CHECK (type IN ('goal','outcome','output','activity'))
    `);
  }
}
