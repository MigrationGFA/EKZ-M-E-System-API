"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FormsLocationGps1700000000008 = void 0;
class FormsLocationGps1700000000008 {
    async up(queryRunner) {
        await queryRunner.query(`
      ALTER TABLE forms
        ADD COLUMN IF NOT EXISTS location_ids UUID[] NOT NULL DEFAULT '{}',
        ADD COLUMN IF NOT EXISTS require_gps   BOOLEAN NOT NULL DEFAULT false
    `);
    }
    async down(queryRunner) {
        await queryRunner.query(`
      ALTER TABLE forms
        DROP COLUMN IF EXISTS location_ids,
        DROP COLUMN IF EXISTS require_gps
    `);
    }
}
exports.FormsLocationGps1700000000008 = FormsLocationGps1700000000008;
//# sourceMappingURL=1700000000008-FormsLocationGps.js.map