import { DataSource } from 'typeorm';
import {
  execAffected,
  logStats,
  makeStats,
  query,
  type Seeder,
} from './helpers.js';

/**
 * Phase 10 — singleton project_meta row + per-instrument financing sources.
 *
 * Anchors per ADR 0001/0004:
 *   baseline_year   = 2022   (RF "Baseline (2022)")
 *   completion_year = 2028   (RF "Target At Completion (2028)")
 *   midpoint_date   = 2025-06-30 (chronological midpoint, ADR 0004)
 *
 * PAR-specific cover fields (sap_code, financing amounts, disbursement
 * deadlines, responsible staff) are seeded with v1 placeholders the admin
 * UI overwrites once the client confirms the exact PAR numbers — per the
 * Phase 10 tooling decision (Option A + placeholders).
 */

const PROJECT_META = {
  name: 'Ekiti Knowledge Zone Project',
  sap_code: 'P-NG-K00-009',
  pdo_text:
    'To promote knowledge economy value chain through innovation and entrepreneurship in technology industry.',
  baseline_year: 2022,
  completion_year: 2028,
  midpoint_date: '2025-06-30',
  sector: 'ICT, Innovation & Industry',
  country: 'Nigeria',
  executing_agency:
    'EKDIPA — Ekiti Development and Investment Promotion Agency',
  responsible_project_staff:
    'EKDIPA PIU Project Coordinator (TBD — admin to assign)',
  original_disbursement_deadline: '2029-06-30',
  revised_disbursement_deadline: null as string | null,
};

interface FinancingSourceSeed {
  source_name: string;
  instrument: 'loan' | 'grant' | 'cofinancing' | 'counterpart';
  total_approved_ua: number;
  disbursed_ua: number;
  order: number;
}

const FINANCING_SOURCES: FinancingSourceSeed[] = [
  {
    source_name: 'AfDB ADB Loan',
    instrument: 'loan',
    total_approved_ua: 50_000_000,
    disbursed_ua: 0,
    order: 1,
  },
  {
    source_name: 'AfDB ADF Grant',
    instrument: 'grant',
    total_approved_ua: 5_000_000,
    disbursed_ua: 0,
    order: 2,
  },
  {
    source_name: 'Federal Government of Nigeria — Counterpart',
    instrument: 'counterpart',
    total_approved_ua: 3_000_000,
    disbursed_ua: 0,
    order: 3,
  },
  {
    source_name: 'Ekiti State Government — Counterpart',
    instrument: 'counterpart',
    total_approved_ua: 2_000_000,
    disbursed_ua: 0,
    order: 4,
  },
];

/**
 * Insert if no project_meta row exists; otherwise backfill only NULL /
 * empty-string columns. This keeps deliberate admin edits intact while
 * still bringing a partially-populated row up to the AfDB cover spec
 * required by the QPR PDF.
 */
async function upsertProjectMeta(
  ds: DataSource,
): Promise<{ id: string; created: boolean; backfilled: string[] }> {
  const existing = await query<{ id: string }>(
    ds,
    `SELECT id FROM project_meta LIMIT 1`,
  );
  if (existing.length === 0) {
    const inserted = await query<{ id: string }>(
      ds,
      `INSERT INTO project_meta (
         name, sap_code, pdo_text,
         baseline_year, completion_year, midpoint_date,
         sector, country, executing_agency, responsible_project_staff,
         original_disbursement_deadline, revised_disbursement_deadline
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
       RETURNING id`,
      [
        PROJECT_META.name,
        PROJECT_META.sap_code,
        PROJECT_META.pdo_text,
        PROJECT_META.baseline_year,
        PROJECT_META.completion_year,
        PROJECT_META.midpoint_date,
        PROJECT_META.sector,
        PROJECT_META.country,
        PROJECT_META.executing_agency,
        PROJECT_META.responsible_project_staff,
        PROJECT_META.original_disbursement_deadline,
        PROJECT_META.revised_disbursement_deadline,
      ],
    );
    return { id: inserted[0].id, created: true, backfilled: [] };
  }
  const id = existing[0].id;
  await enforceAnchorDates(ds, id);
  const backfilled = await backfillCoverFields(ds, id);
  return { id, created: false, backfilled };
}

/**
 * Project anchor dates (baseline_year, completion_year, midpoint_date) come
 * from ADR 0004 and drive the scheduler + year-target math. They are not
 * admin-editable in spirit; the seed always reconciles them to canonical.
 */
async function enforceAnchorDates(ds: DataSource, id: string): Promise<void> {
  await execAffected(
    ds,
    `UPDATE project_meta
       SET baseline_year   = $1,
           completion_year = $2,
           midpoint_date   = $3
       WHERE id = $4
         AND (baseline_year <> $1
              OR completion_year <> $2
              OR midpoint_date IS DISTINCT FROM $3::date)`,
    [
      PROJECT_META.baseline_year,
      PROJECT_META.completion_year,
      PROJECT_META.midpoint_date,
      id,
    ],
  );
}

async function backfillCoverFields(
  ds: DataSource,
  id: string,
): Promise<string[]> {
  const filled: string[] = [];
  const textCols: Array<{ col: keyof typeof PROJECT_META; val: string }> = [
    { col: 'name', val: PROJECT_META.name },
    { col: 'sap_code', val: PROJECT_META.sap_code },
    { col: 'pdo_text', val: PROJECT_META.pdo_text },
    { col: 'sector', val: PROJECT_META.sector },
    { col: 'executing_agency', val: PROJECT_META.executing_agency },
    {
      col: 'responsible_project_staff',
      val: PROJECT_META.responsible_project_staff,
    },
  ];
  for (const { col, val } of textCols) {
    const affected = await execAffected(
      ds,
      `UPDATE project_meta
         SET ${col} = $1
         WHERE id = $2 AND (${col} IS NULL OR ${col} = '')`,
      [val, id],
    );
    if (affected > 0) filled.push(col);
  }
  // Date / numeric cols: backfill only when NULL. (midpoint_date is handled
  // by enforceAnchorDates above — it's an anchor, not an admin-editable field.)
  const nullableCols: Array<{ col: string; val: string | number }> = [
    {
      col: 'original_disbursement_deadline',
      val: PROJECT_META.original_disbursement_deadline,
    },
  ];
  for (const { col, val } of nullableCols) {
    const affected = await execAffected(
      ds,
      `UPDATE project_meta
         SET ${col} = $1
         WHERE id = $2 AND ${col} IS NULL`,
      [val, id],
    );
    if (affected > 0) filled.push(col);
  }
  return filled;
}

export const seedProjectMeta: Seeder = async (ds: DataSource) => {
  const stats = makeStats();
  const result = await upsertProjectMeta(ds);
  if (result.created) {
    stats.inserted += 1;
  } else {
    stats.skipped += 1;
    if (result.backfilled.length > 0) {
      console.log(
        `  [project_meta] backfilled NULL/empty cover fields: ${result.backfilled.join(', ')}`,
      );
    }
  }
  const metaId = result.id;
  logStats('project_meta', stats);

  const finStats = makeStats();
  for (const fs of FINANCING_SOURCES) {
    const exists = await query<{ id: string }>(
      ds,
      `SELECT id FROM project_financing_sources
         WHERE project_meta_id = $1 AND source_name = $2`,
      [metaId, fs.source_name],
    );
    if (exists.length > 0) {
      finStats.skipped += 1;
      continue;
    }
    await ds.query(
      `INSERT INTO project_financing_sources (
         project_meta_id, source_name, instrument,
         total_approved_ua, disbursed_ua, "order"
       ) VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        metaId,
        fs.source_name,
        fs.instrument,
        fs.total_approved_ua,
        fs.disbursed_ua,
        fs.order,
      ],
    );
    finStats.inserted += 1;
  }
  logStats('project_financing_sources', finStats);
};
