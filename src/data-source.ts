import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';

dotenv.config();

const url = process.env.DATABASE_URL;

export default new DataSource({
  type: 'postgres',
  url,
  // Explicitly list all entities to avoid module resolution order issues
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
  ],
  migrations: [__dirname + '/database/migrations/*{.ts,.js}'],
  synchronize: false,
});
