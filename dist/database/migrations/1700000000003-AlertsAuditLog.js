"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AlertsAuditLog1700000000003 = void 0;
class AlertsAuditLog1700000000003 {
    async up(queryRunner) {
        await queryRunner.query(`
      CREATE TABLE alerts (
        id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        title       VARCHAR(255) NOT NULL,
        description TEXT NOT NULL,
        type        VARCHAR(30) NOT NULL CHECK (type IN ('deadline','missed_target','data_flag','sync_success','system')),
        is_read     BOOLEAN NOT NULL DEFAULT false,
        created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);
        await queryRunner.query(`
      CREATE TABLE audit_log (
        id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id     UUID NOT NULL,
        user_name   VARCHAR(255) NOT NULL,
        action      VARCHAR(20) NOT NULL CHECK (action IN ('create','update','delete','login','logout','submit')),
        resource    VARCHAR(50) NOT NULL,
        resource_id VARCHAR(255) NOT NULL,
        before_data JSONB,
        after_data  JSONB,
        created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);
    }
    async down(queryRunner) {
        await queryRunner.query(`DROP TABLE IF EXISTS audit_log;`);
        await queryRunner.query(`DROP TABLE IF EXISTS alerts;`);
    }
}
exports.AlertsAuditLog1700000000003 = AlertsAuditLog1700000000003;
//# sourceMappingURL=1700000000003-AlertsAuditLog.js.map