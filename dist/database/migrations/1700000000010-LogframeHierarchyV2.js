"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LogframeHierarchyV2_1700000000010 = void 0;
class LogframeHierarchyV2_1700000000010 {
    async up(queryRunner) {
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
    async down(queryRunner) {
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
        await queryRunner.query(`
      ALTER TABLE logframe_nodes
        ADD CONSTRAINT logframe_nodes_type_check
        CHECK (type IN ('goal','outcome','output','activity'))
    `);
    }
}
exports.LogframeHierarchyV2_1700000000010 = LogframeHierarchyV2_1700000000010;
//# sourceMappingURL=1700000000010-LogframeHierarchyV2.js.map