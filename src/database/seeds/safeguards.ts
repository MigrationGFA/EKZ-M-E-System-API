import { DataSource } from 'typeorm';
import { logStats, makeStats, query, type Seeder } from './helpers.js';

/**
 * Phase 10 — safeguard_measures skeletons.
 *
 * Two rows: ESMP and RAP. Counts are zero until the first quarterly
 * review populates them via the admin UI. Budget allocations are
 * placeholders the legal/ESS officer refines once the safeguard
 * instruments are finalised.
 */

interface SafeguardSpec {
  type: 'esmp' | 'rap' | 'other';
  measure_name: string;
  budget_allocated_ua: number;
  order: number;
}

const SAFEGUARDS: SafeguardSpec[] = [
  {
    type: 'esmp',
    measure_name: 'Environmental & Social Management Plan (ESMP)',
    budget_allocated_ua: 500_000,
    order: 1,
  },
  {
    type: 'rap',
    measure_name: 'Resettlement Action Plan (RAP) — Ago Araromi & Ijan-Ekiti',
    budget_allocated_ua: 1_850_000,
    order: 2,
  },
];

export const seedSafeguards: Seeder = async (ds: DataSource) => {
  const stats = makeStats();
  for (const s of SAFEGUARDS) {
    const existing = await query<{ id: string }>(
      ds,
      `SELECT id FROM safeguard_measures WHERE type = $1 AND measure_name = $2`,
      [s.type, s.measure_name],
    );
    if (existing.length > 0) {
      stats.skipped += 1;
      continue;
    }
    await ds.query(
      `INSERT INTO safeguard_measures (
         type, measure_name,
         total_count, not_started_count, ongoing_count, completed_count,
         budget_allocated_ua, amount_disbursed_ua, "order"
       ) VALUES ($1, $2, 0, 0, 0, 0, $3, 0, $4)`,
      [s.type, s.measure_name, s.budget_allocated_ua, s.order],
    );
    stats.inserted += 1;
  }
  logStats('safeguard_measures', stats);
};
