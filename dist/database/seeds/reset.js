"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resetAllExceptUsers = void 0;
const TABLES_TO_TRUNCATE = [
    'alerts',
    'audit_log',
    'reports',
    'api_tokens',
    'pii_access_log',
    'evidence_documents',
    'indicator_progress_breakdowns',
    'indicator_progress',
    'indicator_year_targets',
    'indicator_disaggregations',
    'submissions',
    'forms',
    'beneficiary_cohorts',
    'beneficiaries',
    'indicators',
    'project_locations',
    'project_financing_sources',
    'project_covenants',
    'safeguard_measures',
    'project_risks',
    'quarterly_progress_reports',
    'activity_quarterly_status',
    'audit_findings',
    'logframe_nodes',
    'project_meta',
];
const resetAllExceptUsers = async (ds) => {
    if (process.env.CONFIRM_RESET !== 'YES') {
        throw new Error('RESET refused: set CONFIRM_RESET=YES (in addition to ' +
            'RESET_BEFORE_SEED=YES) to authorise the wipe. ' +
            'Both flags are required so a typo in a single CI variable cannot ' +
            'destroy production data.');
    }
    const url = process.env.DATABASE_URL ?? '';
    const host = (() => {
        try {
            const u = new URL(url);
            return `${u.hostname}${u.pathname}`;
        }
        catch {
            return '(unparseable URL)';
        }
    })();
    console.log(`  ⚠ RESET target host: ${host}`);
    const usersBefore = await ds.query(`SELECT COUNT(*)::int AS n FROM users`);
    console.log(`  users (will be preserved): ${usersBefore[0].n}`);
    const tableList = TABLES_TO_TRUNCATE.map((t) => `"${t}"`).join(', ');
    await ds.query(`TRUNCATE TABLE ${tableList} RESTART IDENTITY CASCADE`);
    console.log(`  [reset] truncated ${TABLES_TO_TRUNCATE.length} tables (CASCADE)`);
    const usersAfter = await ds.query(`SELECT COUNT(*)::int AS n FROM users`);
    if (usersAfter[0].n !== usersBefore[0].n) {
        throw new Error(`RESET integrity check failed: users count ${usersBefore[0].n} → ${usersAfter[0].n}. ` +
            `A FK with ON DELETE CASCADE somewhere is pulling users with the wipe — investigate.`);
    }
    console.log('  users count unchanged ✓');
};
exports.resetAllExceptUsers = resetAllExceptUsers;
//# sourceMappingURL=reset.js.map