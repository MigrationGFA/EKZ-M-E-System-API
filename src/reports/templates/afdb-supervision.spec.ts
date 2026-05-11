import { renderAfdbSupervisionPdf } from './afdb-supervision.js';
import type { SupervisionData } from '../reports.service.js';

function makeData(overrides: Partial<SupervisionData> = {}): SupervisionData {
  const base: SupervisionData = {
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
    },
    components: [
      {
        id: 'c1',
        code: 'C1',
        title: 'Skills',
        budget_usd: 5_000_000,
        budget_currency: 'USD',
        indicator_count: 3,
        on_track: 2,
        at_risk: 1,
        off_track: 0,
        progress_pct: 62,
        output_statement_codes: ['OS-1.1', 'OS-1.2'],
      },
    ],
    disaggregation_by_indicator: {},
    ...overrides,
  };
  return base;
}

describe('renderAfdbSupervisionPdf', () => {
  it('returns a non-empty PDF buffer starting with the %PDF- magic', async () => {
    const buf = await renderAfdbSupervisionPdf(makeData());
    expect(buf.length).toBeGreaterThan(1000);
    expect(buf.slice(0, 5).toString()).toBe('%PDF-');
  });

  it('renders the cover-fallback when project_meta is null', async () => {
    const buf = await renderAfdbSupervisionPdf(makeData({ cover: null }));
    expect(buf.length).toBeGreaterThan(800);
    expect(buf.slice(0, 5).toString()).toBe('%PDF-');
  });

  it('handles an empty components + empty logframe payload', async () => {
    const buf = await renderAfdbSupervisionPdf(
      makeData({ components: [], logframe_rows: [] }),
    );
    expect(buf.length).toBeGreaterThan(800);
    expect(buf.slice(0, 5).toString()).toBe('%PDF-');
  });
});
