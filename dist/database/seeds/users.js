"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.seedUsers = void 0;
const bcrypt = __importStar(require("bcrypt"));
const helpers_js_1 = require("./helpers.js");
const SEED_USERS = [
    {
        email: 'admin@ekz.com',
        name: 'Adebola Johnson',
        password: 'Admin123!',
        role: 'admin',
    },
];
const seedUsers = async (ds) => {
    const stats = (0, helpers_js_1.makeStats)();
    for (const user of SEED_USERS) {
        const exists = await (0, helpers_js_1.query)(ds, `SELECT id FROM users WHERE email = $1`, [user.email]);
        if (exists.length > 0) {
            stats.skipped += 1;
            continue;
        }
        const hash = await bcrypt.hash(user.password, 10);
        await ds.query(`INSERT INTO users (email, name, password_hash, role, is_default_password)
       VALUES ($1, $2, $3, $4, true)`, [user.email, user.name, hash, user.role]);
        stats.inserted += 1;
    }
    (0, helpers_js_1.logStats)('users', stats);
};
exports.seedUsers = seedUsers;
//# sourceMappingURL=users.js.map