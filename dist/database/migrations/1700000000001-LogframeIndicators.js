"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LogframeIndicators1700000000001 = void 0;
class LogframeIndicators1700000000001 {
    async up(queryRunner) {
        await queryRunner.query(`
      CREATE TABLE logframe_nodes (
        id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        logframe_id  VARCHAR(50) NOT NULL DEFAULT 'lf_1',
        type         VARCHAR(20) NOT NULL CHECK (type IN ('goal','outcome','output','activity')),
        code         VARCHAR(50) NOT NULL,
        title        TEXT NOT NULL,
        description  TEXT,
        parent_id    UUID REFERENCES logframe_nodes(id) ON DELETE RESTRICT,
        "order"      INTEGER NOT NULL DEFAULT 0,
        created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);
        await queryRunner.query(`
      CREATE TABLE indicators (
        id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        code                  VARCHAR(50) UNIQUE NOT NULL,
        name                  VARCHAR(500) NOT NULL,
        description           TEXT NOT NULL,
        level                 VARCHAR(20) NOT NULL CHECK (level IN ('impact','outcome','output')),
        unit                  VARCHAR(100) NOT NULL,
        baseline              NUMERIC NOT NULL DEFAULT 0,
        target                NUMERIC NOT NULL,
        current_value         NUMERIC NOT NULL DEFAULT 0,
        status                VARCHAR(20) NOT NULL CHECK (status IN ('on_track','at_risk','off_track')),
        frequency             VARCHAR(20) NOT NULL CHECK (frequency IN ('monthly','quarterly','bi_annually','annually')),
        logframe_level_id     UUID REFERENCES logframe_nodes(id) ON DELETE SET NULL,
        sdg_ids               INTEGER[] NOT NULL DEFAULT '{}',
        responsible_party     VARCHAR(255) NOT NULL,
        means_of_verification TEXT NOT NULL,
        created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);
        await queryRunner.query(`
      CREATE TABLE indicator_progress (
        id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        indicator_id  UUID NOT NULL REFERENCES indicators(id) ON DELETE CASCADE,
        value         NUMERIC NOT NULL,
        date          TIMESTAMPTZ NOT NULL,
        notes         TEXT,
        submitted_by  VARCHAR(255) NOT NULL,
        created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);
    }
    async down(queryRunner) {
        await queryRunner.query(`DROP TABLE IF EXISTS indicator_progress;`);
        await queryRunner.query(`DROP TABLE IF EXISTS indicators;`);
        await queryRunner.query(`DROP TABLE IF EXISTS logframe_nodes;`);
    }
}
exports.LogframeIndicators1700000000001 = LogframeIndicators1700000000001;
//# sourceMappingURL=1700000000001-LogframeIndicators.js.map