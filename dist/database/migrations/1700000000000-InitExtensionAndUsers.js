"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InitExtensionAndUsers1700000000000 = void 0;
class InitExtensionAndUsers1700000000000 {
    async up(queryRunner) {
        await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp";`);
        await queryRunner.query(`
      CREATE TABLE users (
        id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        email         VARCHAR(255) UNIQUE NOT NULL,
        name          VARCHAR(255) NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        role          VARCHAR(50) NOT NULL CHECK (role IN ('admin','me_staff','programme_staff','viewer')),
        avatar        TEXT,
        active        BOOLEAN NOT NULL DEFAULT true,
        last_login    TIMESTAMPTZ,
        created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);
    }
    async down(queryRunner) {
        await queryRunner.query(`DROP TABLE IF EXISTS users;`);
    }
}
exports.InitExtensionAndUsers1700000000000 = InitExtensionAndUsers1700000000000;
//# sourceMappingURL=1700000000000-InitExtensionAndUsers.js.map