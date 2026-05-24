import { DataSource } from 'typeorm';
import type { Seeder } from './helpers.js';

/**
 * Phase 10 — destructive reset of all project data.
 *
 * Wipes every table that holds project content created by users, the admin
 * UI, or prior seeds — keeping only:
 *   - `users` (real accounts must survive)
 *   - `cohorts` (re-seeded idempotently by migration 1700000000014; we
 *     leave the migrated rows in place so beneficiary FKs stay valid)
 *
 * **Belt-and-braces guards.** This runs only when BOTH env flags are set:
 *
 *   RESET_BEFORE_SEED=YES   CONFIRM_RESET=YES
 *
 * The seed director wires `resetAllExceptUsers` into the SEEDERS array as
 * the first step only when RESET_BEFORE_SEED is YES. The function itself
 * then refuses unless CONFIRM_RESET is also YES. That makes accidental
 * fire impossible from a typo in a CI variable name.
 *
 * Truncation is one statement with CASCADE so Postgres handles FK order
 * and we cannot leave the DB in a half-wiped state if it fails midway.
 */

const TABLES_TO_TRUNCATE: string[] = [
  // Audit / alert / report channels — references everything else, so they
  // can be wiped freely.
  'alerts',
  'audit_log',
  'reports',
  'api_tokens',
  'pii_access_log',
  // Evidence + progress + disaggregation — children of indicators.
  'evidence_documents',
  'indicator_progress_breakdowns',
  'indicator_progress',
  'indicator_year_targets',
  'indicator_disaggregations',
  // Submissions + forms.
  'submissions',
  'forms',
  // Beneficiaries (cohorts catalogue is kept; only the join table goes).
  'beneficiary_cohorts',
  'beneficiaries',
  // Indicators + their parents.
  'indicators',
  // Locations.
  'project_locations',
  // QPR satellite tables.
  'project_financing_sources',
  'project_covenants',
  'safeguard_measures',
  'project_risks',
  'quarterly_progress_reports',
  'activity_quarterly_status',
  'audit_findings',
  // Logframe + project_meta (last because indicators FK to logframe_nodes).
  'logframe_nodes',
  'project_meta',
];

export const resetAllExceptUsers: Seeder = async (ds: DataSource) => {
  if (process.env.CONFIRM_RESET !== 'YES') {
    throw new Error(
      'RESET refused: set CONFIRM_RESET=YES (in addition to ' +
        'RESET_BEFORE_SEED=YES) to authorise the wipe. ' +
        'Both flags are required so a typo in a single CI variable cannot ' +
        'destroy production data.',
    );
  }

  const url = process.env.DATABASE_URL ?? '';
  // Print the host but never the password — give the operator one last
  // chance to abort if they have the wrong URL pointed at the wrong env.
  const host = (() => {
    try {
      const u = new URL(url);
      return `${u.hostname}${u.pathname}`;
    } catch {
      return '(unparseable URL)';
    }
  })();
  console.log(`  ⚠ RESET target host: ${host}`);

  // Confirm pre-state in one query so we can show it in the log.
  const usersBefore = await ds.query<{ n: number }[]>(
    `SELECT COUNT(*)::int AS n FROM users`,
  );
  console.log(`  users (will be preserved): ${usersBefore[0].n}`);

  // Build one TRUNCATE statement so it succeeds or fails atomically;
  // CASCADE lets Postgres pick FK order for us.
  const tableList = TABLES_TO_TRUNCATE.map((t) => `"${t}"`).join(', ');
  await ds.query(`TRUNCATE TABLE ${tableList} RESTART IDENTITY CASCADE`);
  console.log(
    `  [reset] truncated ${TABLES_TO_TRUNCATE.length} tables (CASCADE)`,
  );

  // Post-state sanity check.
  const usersAfter = await ds.query<{ n: number }[]>(
    `SELECT COUNT(*)::int AS n FROM users`,
  );
  if (usersAfter[0].n !== usersBefore[0].n) {
    throw new Error(
      `RESET integrity check failed: users count ${usersBefore[0].n} → ${usersAfter[0].n}. ` +
        `A FK with ON DELETE CASCADE somewhere is pulling users with the wipe — investigate.`,
    );
  }
  console.log('  users count unchanged ✓');
};
