"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FormFieldMappings1700000000007 = void 0;
class FormFieldMappings1700000000007 {
    async up(queryRunner) {
        await queryRunner.query(`
      ALTER TABLE forms
        ADD COLUMN IF NOT EXISTS field_mappings JSONB NOT NULL DEFAULT '[]'
    `);
    }
    async down(queryRunner) {
        await queryRunner.query(`
      ALTER TABLE forms DROP COLUMN IF EXISTS field_mappings
    `);
    }
}
exports.FormFieldMappings1700000000007 = FormFieldMappings1700000000007;
//# sourceMappingURL=1700000000007-FormFieldMappings.js.map