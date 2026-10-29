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
const typeorm_1 = require("typeorm");
const dotenv = __importStar(require("dotenv"));
dotenv.config();
const dbHost = process.env.DB_HOST || 'localhost';
const dbPort = process.env.DB_PORT || '5432';
const dbUser = process.env.DB_USER || 'ekitikno_ekzuser';
const dbPassword = process.env.DB_PASSWORD || '';
const dbName = process.env.DB_NAME || 'ekitikno_ekz';
const DATABASE_URL = process.env.DATABASE_URL ||
    `postgresql://${dbUser}:${dbPassword}@${dbHost}:${dbPort}/${dbName}`;
exports.default = new typeorm_1.DataSource({
    type: 'postgres',
    url: DATABASE_URL,
    migrations: [__dirname + '/database/migrations/*.js'],
    synchronize: false,
    migrationsRun: true,
    uuidExtension: 'pgcrypto',
    installExtensions: false,
    entities: [
        __dirname + '/users/user.entity.ts',
        __dirname + '/alerts/alert.entity.ts',
        __dirname + '/api-tokens/api-token.entity.ts',
        __dirname + '/audit/audit-entry.entity.ts',
        __dirname + '/awp-status/activity-quarterly-status.entity.ts',
        __dirname + '/beneficiaries/beneficiary.entity.ts',
        __dirname + '/beneficiaries/cohort.entity.ts',
        __dirname + '/beneficiaries/pii-access-log.entity.ts',
        __dirname + '/compliance/audit-findings/audit-finding.entity.ts',
        __dirname + '/compliance/covenants/project-covenant.entity.ts',
        __dirname + '/compliance/safeguards/safeguard-measure.entity.ts',
        __dirname + '/evidence/evidence-document.entity.ts',
        __dirname + '/forms/form.entity.ts',
        __dirname + '/indicators/indicator-disaggregation.entity.ts',
        __dirname + '/indicators/indicator-progress-breakdown.entity.ts',
        __dirname + '/indicators/indicator-progress.entity.ts',
        __dirname + '/indicators/indicator-year-target.entity.ts',
        __dirname + '/indicators/indicator.entity.ts',
        __dirname + '/locations/project-location.entity.ts',
        __dirname + '/logframe/logframe-node.entity.ts',
        __dirname + '/project-financing-sources/project-financing-source.entity.ts',
        __dirname + '/project-meta/project-meta.entity.ts',
        __dirname + '/project-risks/project-risk.entity.ts',
        __dirname + '/quarterly-reports/quarterly-progress-report.entity.ts',
        __dirname + '/reports/report.entity.ts',
        __dirname + '/submissions/submission.entity.ts',
        __dirname + '/users/user.entity.ts',
    ],
});
//# sourceMappingURL=data-source.js.map