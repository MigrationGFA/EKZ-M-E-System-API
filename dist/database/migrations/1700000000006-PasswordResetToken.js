"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PasswordResetToken1700000000006 = void 0;
class PasswordResetToken1700000000006 {
    name = 'PasswordResetToken1700000000006';
    async up(queryRunner) {
        await queryRunner.query(`
      ALTER TABLE "users"
        ADD COLUMN "password_reset_token" VARCHAR(64),
        ADD COLUMN "password_reset_expires" TIMESTAMPTZ
    `);
    }
    async down(queryRunner) {
        await queryRunner.query(`
      ALTER TABLE "users"
        DROP COLUMN "password_reset_token",
        DROP COLUMN "password_reset_expires"
    `);
    }
}
exports.PasswordResetToken1700000000006 = PasswordResetToken1700000000006;
//# sourceMappingURL=1700000000006-PasswordResetToken.js.map