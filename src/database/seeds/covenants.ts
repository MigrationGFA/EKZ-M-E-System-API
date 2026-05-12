import { DataSource } from 'typeorm';
import { logStats, makeStats, query, type Seeder } from './helpers.js';

/**
 * Phase 10 — project_covenants seed.
 *
 * Standard AfDB sovereign-operation covenants grouped by type:
 *   - entry_into_force: precedent to the loan/grant becoming effective.
 *   - first_disbursement: precedent to the first drawdown.
 *   - undertaking:        recurrent obligations over the life of the project.
 *
 * Exact wording is templated from the AfDB General Conditions for sovereign
 * operations; the project legal officer can refine via the admin UI once
 * the actual loan/grant agreements are countersigned. Status defaults to
 * `pending_initiation` — admin updates as conditions are met.
 */

interface CovenantSpec {
  covenant_text: string;
  type: 'entry_into_force' | 'first_disbursement' | 'undertaking';
  order: number;
}

const COVENANTS: CovenantSpec[] = [
  {
    covenant_text:
      'Loan and Grant Agreements duly executed and delivered by the Borrower and the Recipient.',
    type: 'entry_into_force',
    order: 1,
  },
  {
    covenant_text:
      'Submission of legal opinion from the Federal Ministry of Justice confirming the validity of the Loan and Grant Agreements.',
    type: 'entry_into_force',
    order: 2,
  },
  {
    covenant_text:
      'Establishment of the Project Implementation Unit (PIU) within EKDIPA, with qualified key staff (Project Coordinator, M&E Specialist, Financial Management Specialist, Procurement Specialist, Environmental & Social Safeguards Specialist) acceptable to the Bank.',
    type: 'first_disbursement',
    order: 3,
  },
  {
    covenant_text:
      'Opening of dedicated project bank accounts (Special Account for AfDB Loan/Grant and a Counterpart Account) in commercial banks acceptable to the Bank.',
    type: 'first_disbursement',
    order: 4,
  },
  {
    covenant_text:
      'Submission and Bank approval of the 18-month Procurement Plan covering the initial works, goods and consulting services packages.',
    type: 'first_disbursement',
    order: 5,
  },
  {
    covenant_text:
      'Bank clearance of the ESMP and RAP implementation arrangements, with budget lines and responsible parties identified.',
    type: 'first_disbursement',
    order: 6,
  },
  {
    covenant_text:
      'Submission of annual audited financial statements of the Project to the Bank within six (6) months of the end of each fiscal year.',
    type: 'undertaking',
    order: 7,
  },
  {
    covenant_text:
      'Submission of quarterly progress reports to the Bank within thirty (30) days following the end of each calendar quarter.',
    type: 'undertaking',
    order: 8,
  },
  {
    covenant_text:
      'Conduct of a Mid-Term Review by the Bank and the Borrower at the project midpoint (target: 30 June 2025).',
    type: 'undertaking',
    order: 9,
  },
  {
    covenant_text:
      'Compliance with the Environmental & Social Management Plan (ESMP) and the Resettlement Action Plan (RAP) throughout project implementation, with semi-annual reporting to the Bank.',
    type: 'undertaking',
    order: 10,
  },
  {
    covenant_text:
      'Submission of the Borrower’s Project Completion Report (PCR) to the Bank within six (6) months of the project completion date.',
    type: 'undertaking',
    order: 11,
  },
];

export const seedCovenants: Seeder = async (ds: DataSource) => {
  const stats = makeStats();
  for (const cov of COVENANTS) {
    const existing = await query<{ id: string }>(
      ds,
      `SELECT id FROM project_covenants WHERE "order" = $1`,
      [cov.order],
    );
    if (existing.length > 0) {
      stats.skipped += 1;
      continue;
    }
    await ds.query(
      `INSERT INTO project_covenants (covenant_text, type, status, comments, "order")
       VALUES ($1, $2, 'pending_initiation', '', $3)`,
      [cov.covenant_text, cov.type, cov.order],
    );
    stats.inserted += 1;
  }
  logStats('project_covenants', stats);
};
