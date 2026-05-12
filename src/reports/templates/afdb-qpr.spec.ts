import { renderAfdbQprPdf } from './afdb-qpr.js';
import type { QprData } from '../reports.service.js';

function makeData(overrides: Partial<QprData> = {}): QprData {
  const base: QprData = {
    period: { year: 2026, quarter: 2 },
    meta: {
      generated_at: '2026-05-12T00:00:00Z',
      generated_by: 'test@ekz',
      date_from: null,
      date_to: null,
    },
    executive_summary: {
      total_indicators: 3,
      on_track: 2,
      at_risk: 1,
      off_track: 0,
      on_track_pct: 67,
      total_submissions: 12,
      approved_submissions: 10,
      pending_submissions: 1,
      rejected_submissions: 1,
      off_site_submissions: 0,
      data_verified_pct: 83,
    },
    logframe_rows: [],
    data_quality: {
      total_submissions: 12,
      approved_count: 10,
      rejected_count: 1,
      pending_count: 1,
      off_site_count: 0,
      verified_pct: 83,
    },
    cover: {
      name: 'EKZ Knowledge Zone',
      sap_code: 'P-NG-EK-001',
      pdo_text:
        'Increase employability and economic inclusion of youth in Ekiti.',
      baseline_year: 2024,
      completion_year: 2028,
      midpoint_date: '2026-06-30',
      sector: 'Knowledge Economy / ICT',
      country: 'Nigeria',
      executing_agency: 'EKDIPA',
      responsible_project_staff: 'Dr. Olamide Ade',
      original_disbursement_deadline: '2028-12-31',
      revised_disbursement_deadline: null,
      financing_sources: [
        {
          source_name: 'AfDB ADF Loan',
          instrument: 'loan',
          total_approved_ua: 25_000_000,
          disbursed_ua: 8_400_000,
          disbursed_pct: 34,
        },
      ],
    },
    components: [],
    disaggregation_by_indicator: {},
    risks: [
      {
        key_issue: 'Delayed land acquisition for Block C',
        corrective_action: 'Engage state legal team',
        responsibility: 'Director of Operations',
        deadline: '2026-09-30',
        status: 'in_progress',
        comments: '',
      },
    ],
    narratives: {
      executive_summary:
        'Q2 saw the completion of two outcome milestones and broke ground on Component C2.',
      pdo_assessment: 'On track at 41% of completion target.',
      unanticipated_results: [
        { category: 'gender', text: '+15% female enrolment beyond target.' },
      ],
      bank_performance_assessment: 'Satisfactory.',
      borrower_performance_assessment: 'Highly satisfactory.',
      cofinancier_performance_assessment: '',
      pmt_status: 'PMT fully staffed; quarterly retreat held in March.',
      awp_planned_next_qtr:
        'Complete Block A handover; launch SME incubation cohort 3.',
    },
    awp_current_qtr: [
      {
        node_code: 'ACT-1.1.1',
        node_title: 'Recruit and enrol trainees for TVET programme',
        component_code: 'C1',
        deadline: '2026-06-15',
        status: 'in_progress',
        pct_achievement: 65,
        comments: 'On schedule',
      },
    ],
    awp_next_qtr: [],
    compliance: {
      covenants: [
        {
          covenant_text: 'Maintain ESMP through implementation.',
          type: 'undertaking',
          status: 'in_progress',
          comments: '',
        },
      ],
      safeguards: [
        {
          type: 'esmp',
          measure_name: 'Erosion-control plan',
          total_count: 5,
          not_started_count: 1,
          ongoing_count: 2,
          completed_count: 2,
          budget_allocated_ua: 250_000,
          amount_disbursed_ua: 80_000,
          progress_pct: 40,
        },
      ],
      audit_findings: [],
    },
    annex1: [
      {
        output_code: 'OS-1.1',
        output_name: 'Verified TVET graduates entering employment',
        baseline: 0,
        years: [
          { year: 2024, original: 500, updated: 600, actual: 480 },
          { year: 2026, original: 2500, updated: 2700, actual: 1240 },
          { year: 2028, original: 5000, updated: 5200, actual: null },
        ],
      },
    ],
    ...overrides,
  };
  return base;
}

describe('renderAfdbQprPdf', () => {
  it('returns a non-empty PDF buffer with the %PDF- magic', async () => {
    const buf = await renderAfdbQprPdf(makeData());
    expect(buf.length).toBeGreaterThan(2000);
    expect(buf.slice(0, 5).toString()).toBe('%PDF-');
  });

  it('renders the cover-fallback when project_meta is null', async () => {
    const buf = await renderAfdbQprPdf(makeData({ cover: null }));
    expect(buf.length).toBeGreaterThan(1000);
    expect(buf.slice(0, 5).toString()).toBe('%PDF-');
  });

  it('renders placeholder panels for C.3 / C.4 / Annexes 2-5', async () => {
    const buf = await renderAfdbQprPdf(makeData());
    // We don't parse the PDF; we just confirm it's non-trivially large
    // (placeholders + tables push it past 5000 bytes easily).
    expect(buf.length).toBeGreaterThan(5000);
  });

  it('handles empty risks / awp / compliance arrays gracefully', async () => {
    const buf = await renderAfdbQprPdf(
      makeData({
        risks: [],
        awp_current_qtr: [],
        awp_next_qtr: [],
        compliance: { covenants: [], safeguards: [], audit_findings: [] },
        annex1: [],
      }),
    );
    expect(buf.slice(0, 5).toString()).toBe('%PDF-');
    expect(buf.length).toBeGreaterThan(2000);
  });
});
