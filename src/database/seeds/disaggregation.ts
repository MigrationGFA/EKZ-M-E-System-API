import { DataSource } from 'typeorm';
import {
  logStats,
  makeStats,
  query,
  resolveIndicatorId,
  type Seeder,
} from './helpers.js';

/**
 * Phase 10 — disaggregation rules per ADR 0003 + Phase 4.
 *
 * Only indicators that count people (jobs, training, beneficiaries) get
 * disaggregation by default. Roads, water-km, MW capacity, policy yes/no,
 * and similar counts of physical / institutional artefacts do not.
 *
 * `breakdown_target` carries the RF / MP percentage commitments — e.g.
 * "70% youth; 40% women" — so the UI can render expected-vs-actual splits.
 * Cohort breakdowns reference the codes seeded by the Phase-5 migration
 * (the cohort_catalogue is already idempotent at the migration layer).
 */

type Axis =
  | 'sex'
  | 'age_band'
  | 'cohort'
  | 'skill_level'
  | 'geography'
  | 'university_origin';

interface RuleSpec {
  indicatorCode: string;
  indicatorKind: 'outcome' | 'output';
  axis: Axis;
  required: boolean;
  breakdown_target: Record<string, number> | null;
  notes: string | null;
}

const RULES: RuleSpec[] = [
  // Outcome 1.1 Direct jobs — 70% youth; 40% women
  {
    indicatorCode: '1.1',
    indicatorKind: 'outcome',
    axis: 'sex',
    required: true,
    breakdown_target: { female: 0.4, male: 0.6 },
    notes: 'RF target: 40% women.',
  },
  {
    indicatorCode: '1.1',
    indicatorKind: 'outcome',
    axis: 'age_band',
    required: true,
    breakdown_target: { youth: 0.7, adult: 0.3 },
    notes: 'RF target: 70% youth (age 18–35).',
  },
  // Outcome 1.2 Indirect jobs — 70% youth; 40% women
  {
    indicatorCode: '1.2',
    indicatorKind: 'outcome',
    axis: 'sex',
    required: true,
    breakdown_target: { female: 0.4, male: 0.6 },
    notes: 'RF target: 40% women. Estimated from mid-term tracer study.',
  },
  {
    indicatorCode: '1.2',
    indicatorKind: 'outcome',
    axis: 'age_band',
    required: true,
    breakdown_target: { youth: 0.7, adult: 0.3 },
    notes: 'RF target: 70% youth (age 18–35).',
  },
  // Outcome 2.1 Youth ICT — disaggregated by gender
  {
    indicatorCode: '2.1',
    indicatorKind: 'outcome',
    axis: 'sex',
    required: true,
    breakdown_target: null,
    notes: 'Required by RF; no explicit % target.',
  },
  // Outcome 2.2 New tech businesses — 90% youth; 40% women (founder demographics)
  {
    indicatorCode: '2.2',
    indicatorKind: 'outcome',
    axis: 'sex',
    required: true,
    breakdown_target: { female: 0.4, male: 0.6 },
    notes: 'RF target: 40% women founders.',
  },
  {
    indicatorCode: '2.2',
    indicatorKind: 'outcome',
    axis: 'age_band',
    required: true,
    breakdown_target: { youth: 0.9, adult: 0.1 },
    notes: 'RF target: 90% youth founders.',
  },
  // Outcome 3.1 Firms — leadership by sex and age
  {
    indicatorCode: '3.1',
    indicatorKind: 'outcome',
    axis: 'sex',
    required: false,
    breakdown_target: null,
    notes: 'RF notes leadership disaggregation; not target-bound.',
  },
  // Output 3.3 Devices — underprivileged young women + youth from social registry
  {
    indicatorCode: '3.3',
    indicatorKind: 'output',
    axis: 'sex',
    required: true,
    breakdown_target: { female: 0.5, male: 0.5 },
    notes: 'Selected from poorest / vulnerable households; mixed sex.',
  },
  {
    indicatorCode: '3.3',
    indicatorKind: 'output',
    axis: 'cohort',
    required: true,
    breakdown_target: null,
    notes:
      'Tagged against the social-registry cohorts (low-income HH; affected-livelihood HH) per ADR 0003.',
  },
  // Output 4.1 Youth trained & certified — 40% female; 500 from HHs with affected livelihoods; ≥10% advanced
  {
    indicatorCode: '4.1',
    indicatorKind: 'output',
    axis: 'sex',
    required: true,
    breakdown_target: { female: 0.4, male: 0.6 },
    notes: 'RF target: 40% female trainees.',
  },
  {
    indicatorCode: '4.1',
    indicatorKind: 'output',
    axis: 'cohort',
    required: true,
    // 500 of 8000 = 6.25% from affected-livelihood households.
    breakdown_target: { affected_livelihood: 0.0625 },
    notes:
      'RF target: at least 500 trainees from households with affected livelihoods (Ago Araromi / Ijan-Ekiti).',
  },
  {
    indicatorCode: '4.1',
    indicatorKind: 'output',
    axis: 'skill_level',
    required: true,
    breakdown_target: { advanced: 0.1, basic_intermediate: 0.9 },
    notes: 'RF target: at least 10% trained in advanced-level skills.',
  },
];

export const seedDisaggregation: Seeder = async (ds: DataSource) => {
  const stats = makeStats();
  for (const rule of RULES) {
    const indicatorId = await resolveIndicatorId(
      ds,
      rule.indicatorCode,
      rule.indicatorKind,
    );
    const existing = await query<{ id: string }>(
      ds,
      `SELECT id FROM indicator_disaggregations
        WHERE indicator_id = $1 AND axis = $2`,
      [indicatorId, rule.axis],
    );
    if (existing.length > 0) {
      stats.skipped += 1;
      continue;
    }
    await ds.query(
      `INSERT INTO indicator_disaggregations
         (indicator_id, axis, required, breakdown_target, notes)
       VALUES ($1, $2, $3, $4::jsonb, $5)`,
      [
        indicatorId,
        rule.axis,
        rule.required,
        rule.breakdown_target ? JSON.stringify(rule.breakdown_target) : null,
        rule.notes,
      ],
    );
    stats.inserted += 1;
  }
  logStats('indicator_disaggregations', stats);
};
