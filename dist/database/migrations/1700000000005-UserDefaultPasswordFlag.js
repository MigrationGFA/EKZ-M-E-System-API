"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserDefaultPasswordFlag1700000000005 = void 0;
class UserDefaultPasswordFlag1700000000005 {
    async up(queryRunner) {
        await queryRunner.query(`
      ALTER TABLE users
      ADD COLUMN is_default_password BOOLEAN NOT NULL DEFAULT false;
    `);
        await queryRunner.query(`
      UPDATE users SET is_default_password = true;
    `);
    }
    async down(queryRunner) {
        await queryRunner.query(`
      ALTER TABLE users DROP COLUMN is_default_password;
    `);
    }
}
exports.UserDefaultPasswordFlag1700000000005 = UserDefaultPasswordFlag1700000000005;
//# sourceMappingURL=1700000000005-UserDefaultPasswordFlag.js.map