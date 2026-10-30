import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';

dotenv.config();

// Use individual DB env vars (compatible with cPanel/Passenger)
const dbHost = process.env.DB_HOST || 'localhost';
const dbPort = process.env.DB_PORT || '5432';
const dbUser = process.env.DB_USER || 'ekitikno_ekzuser';
const dbPassword = process.env.DB_PASSWORD || '';
const dbName = process.env.DB_NAME || 'ekitikno_ekz';

const DATABASE_URL =
  process.env.DATABASE_URL ||
  `postgresql://${dbUser}:${dbPassword}@${dbHost}:${dbPort}/${dbName}`;

export default new DataSource({
  type: 'postgres',
  url: DATABASE_URL,
  // Migrations path pointing to compiled dist folder
  migrations: [__dirname + '/database/migrations/*.js'],
  synchronize: false,
  // Run migrations on startup
  migrationsRun: true,
  installExtensions: false,
  // retryAttempts: 3,
  // Explicitly list entities to avoid module resolution order issues
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
