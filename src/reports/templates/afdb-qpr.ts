/**
 * Phase 9.5 — AfDB Quarterly Project Progress Report (QPR) template.
 *
 * Renders a QprData payload (see reports.service.ts) into a PDF buffer
 * using PDFKit. Section order matches Client-Update/request.pdf:
 *
 *   A.1 Project data (cover)
 *   A.2 Executive summary
 *   A.3 Issues, challenges, risks
 *   B.1 PDO progress
 *   B.2 Outcome reporting
 *   B.3 Output reporting
 *   B.4 Unanticipated / additional results
 *   C.1.1 Compliance with project covenants
 *   C.1.2 Compliance with E&S safeguards
 *   C.1.3 Audit compliance
 *   C.2.1 Activities — previous quarter
 *   C.2.2 Activities — next quarter
 *   C.3   Procurement performance         (placeholder — Procurement Unit)
 *   C.4   Project execution and financing (placeholder — Finance Unit)
 *   C.5   Performance of stakeholders
 *   Annex 1 Output projections and status
 *   Annexes 2-5                            (placeholders — owned by source teams)
 *
 * Procurement and Financial sections render as labelled placeholder
 * panels rather than blank — that's the Phase 9.5 scope decision.
 */

import PDFDocument from 'pdfkit';
import type { QprData } from '../reports.service.js';

const PAGE_MARGIN = 48;
const EKZ_GREEN = '#1d6a4a';
const MUTED = '#6b7280';
const HEADER_BG = '#0f3a82';
const SECTION_BG = '#2e9d50';

function fmtCurrency(value: number, currency = 'UA'): string {
  return (
    new Intl.NumberFormat('en-US', {
      maximumFractionDigits: 0,
    }).format(value) + ` ${currency}`
  );
}

function quarterLabel(year: number, quarter: number): string {
  return `Q${quarter} ${year}`;
}

export async function renderAfdbQprPdf(data: QprData): Promise<Buffer> {
  const doc = new PDFDocument({
    size: 'A4',
    margin: PAGE_MARGIN,
    info: {
      Title: `AfDB QPR — ${data.cover?.name ?? 'EKZ M&E'} ${quarterLabel(
        data.period.year,
        data.period.quarter,
      )}`,
      Author: data.meta.generated_by,
      Producer: 'EKZ M&E System',
      CreationDate: new Date(data.meta.generated_at),
    },
  });

  const chunks: Buffer[] = [];
  doc.on('data', (chunk) => chunks.push(chunk as Buffer));
  const done = new Promise<Buffer>((resolve) => {
    doc.on('end', () => resolve(Buffer.concat(chunks)));
  });

  renderCover(doc, data);
  renderA2ExecSummary(doc, data);
  renderA3Risks(doc, data);
  renderB1PdoProgress(doc, data);
  renderB2Outcomes(doc, data);
  renderB3Outputs(doc, data);
  renderB4Unanticipated(doc, data);
  renderC11Covenants(doc, data);
  renderC12Safeguards(doc, data);
  renderC13AuditCompliance(doc, data);
  renderC21Activities(doc, data);
  renderC22Activities(doc, data);
  renderC3Placeholder(doc);
  renderC4Placeholder(doc);
  renderC5Stakeholders(doc, data);
  renderAnnex1(doc, data);
  renderAnnex2to5Placeholder(doc);

  doc.end();
  return done;
}

// ─── Cover & section A ─────────────────────────────────────────────────────

function renderCover(doc: PDFKit.PDFDocument, data: QprData): void {
  doc.font('Helvetica-Bold').fontSize(10).fillColor(MUTED);
  doc.text('QUARTERLY PROJECT PROGRESS REPORT', { align: 'center' });
  doc.moveDown(2);

  doc.font('Helvetica-Bold').fontSize(24).fillColor(EKZ_GREEN);
  doc.text(data.cover?.name ?? 'EKZ Monitoring & Evaluation', {
    align: 'center',
  });
  doc.moveDown(0.4);

  doc.font('Helvetica').fontSize(11).fillColor(MUTED);
  doc.text(quarterLabel(data.period.year, data.period.quarter), {
    align: 'center',
  });
  doc.moveDown(2);

  if (!data.cover) {
    doc.font('Helvetica').fontSize(11).fillColor(MUTED);
    doc.text(
      'Project metadata not yet configured. Run /admin/project-meta to populate the cover page.',
      { align: 'center' },
    );
    return;
  }

  // A.1 data table
  blueBanner(doc, 'A — REPORT SUMMARY AND PROPOSED ACTIONS');
  greenBanner(doc, 'A.1 — Project data');
  kvTable(doc, [
    ['Project Title', data.cover.name],
    ['Project Code', data.cover.sap_code ?? '—'],
    ['Country', data.cover.country],
    ['Sector', data.cover.sector ?? '—'],
    ['Executing Agency', data.cover.executing_agency ?? '—'],
    ['Responsible Project Staff', data.cover.responsible_project_staff ?? '—'],
    ['Project Development Objective', data.cover.pdo_text],
    ['Baseline year', String(data.cover.baseline_year)],
    ['Completion year', String(data.cover.completion_year)],
    [
      'Original disbursement deadline',
      data.cover.original_disbursement_deadline ?? '—',
    ],
    [
      'Revised disbursement deadline',
      data.cover.revised_disbursement_deadline ?? '—',
    ],
  ]);

  if (data.cover.financing_sources.length > 0) {
    doc.moveDown(0.6);
    doc.font('Helvetica-Bold').fontSize(10).fillColor('black');
    doc.text('Financing sources');
    doc.moveDown(0.2);
    const head = [
      'Source',
      'Instrument',
      'Approved (UA)',
      'Disbursed (UA)',
      '%',
    ];
    const rows = data.cover.financing_sources.map((s) => [
      s.source_name,
      s.instrument,
      fmtCurrency(s.total_approved_ua, ''),
      fmtCurrency(s.disbursed_ua, ''),
      `${s.disbursed_pct}%`,
    ]);
    simpleTable(doc, head, rows, [140, 80, 95, 95, 50]);
  }

  doc.moveDown(2);
  doc.font('Helvetica').fontSize(9).fillColor(MUTED);
  doc.text(
    `Generated ${new Date(data.meta.generated_at).toISOString().slice(0, 10)} by ${data.meta.generated_by}`,
    { align: 'center' },
  );
}

function renderA2ExecSummary(doc: PDFKit.PDFDocument, data: QprData): void {
  doc.addPage();
  greenBanner(doc, 'A.2 — Executive summary on project implementation');
  doc.font('Helvetica').fontSize(11).fillColor('black');
  if (data.narratives.executive_summary?.trim()) {
    doc.text(data.narratives.executive_summary, { align: 'justify' });
  } else {
    placeholderLine(
      doc,
      `Not yet entered. Populate via /admin/quarterly-narratives for ${quarterLabel(data.period.year, data.period.quarter)}.`,
    );
  }
}

function renderA3Risks(doc: PDFKit.PDFDocument, data: QprData): void {
  doc.moveDown(1);
  greenBanner(doc, 'A.3 — Issues, challenges, risks and actions for attention');
  if (data.risks.length === 0) {
    placeholderLine(doc, 'No active risks recorded.');
    return;
  }
  const head = [
    'Key Issue / Risk',
    'Corrective action',
    'Responsibility',
    'Deadline',
    'Status',
  ];
  const rows = data.risks.map((r) => [
    r.key_issue,
    r.corrective_action || '—',
    r.responsibility || '—',
    r.deadline ?? '—',
    r.status,
  ]);
  simpleTable(doc, head, rows, [120, 130, 80, 60, 70]);
}

// ─── Section B ─────────────────────────────────────────────────────────────

function renderB1PdoProgress(doc: PDFKit.PDFDocument, data: QprData): void {
  doc.addPage();
  blueBanner(doc, 'B — RESULTS REPORTING');
  greenBanner(doc, 'B.1 — Progress toward Project Development Objective');
  doc.font('Helvetica-Bold').fontSize(10).fillColor('black');
  doc.text('PDO');
  doc.font('Helvetica').fontSize(10).fillColor('black');
  doc.text(data.cover?.pdo_text ?? '(no PDO recorded)', { align: 'justify' });
  doc.moveDown(0.5);
  doc.font('Helvetica-Bold').fontSize(10).text('Assessment');
  doc.font('Helvetica').fontSize(10);
  if (data.narratives.pdo_assessment?.trim()) {
    doc.text(data.narratives.pdo_assessment, { align: 'justify' });
  } else {
    placeholderLine(doc, 'Not yet entered.');
  }
}

function renderB2Outcomes(doc: PDFKit.PDFDocument, data: QprData): void {
  doc.moveDown(1);
  greenBanner(doc, 'B.2 — Outcome reporting');
  const outcomeIndicators = data.logframe_rows
    .filter((r) => r.type === 'outcome_statement' || r.type === 'outcome')
    .flatMap((r) => r.indicators);
  if (outcomeIndicators.length === 0) {
    placeholderLine(doc, 'No outcome indicators defined.');
    return;
  }
  const head = [
    'Outcome Indicator',
    'Baseline',
    'Most recent',
    'End Target',
    'Progress %',
    'Assessment',
  ];
  const rows = outcomeIndicators.map((i) => [
    `${i.code} ${i.name}`,
    String(i.baseline),
    String(i.current_value),
    String(i.target),
    `${i.progress_pct}%`,
    i.status === 'on_track' ? 'On track' : 'Off track',
  ]);
  simpleTable(doc, head, rows, [180, 50, 60, 60, 60, 70]);
}

function renderB3Outputs(doc: PDFKit.PDFDocument, data: QprData): void {
  doc.moveDown(1);
  greenBanner(doc, 'B.3 — Output reporting');
  const outputIndicators = data.logframe_rows
    .filter((r) => r.type === 'output_statement' || r.type === 'output')
    .flatMap((r) => r.indicators);
  if (outputIndicators.length === 0) {
    placeholderLine(doc, 'No output indicators defined.');
    return;
  }
  const head = [
    'Output Indicator',
    'Most recent',
    'Annual Target',
    'End Target',
    'Annual %',
    'End %',
    'Assessment',
  ];
  const rows = outputIndicators.map((i) => [
    `${i.code} ${i.name}`,
    String(i.current_value),
    String(i.expected_at_now ?? '—'),
    String(i.target),
    `${i.expected_at_now > 0 ? Math.round((Number(i.current_value) / i.expected_at_now) * 100) : 0}%`,
    `${i.progress_pct}%`,
    i.status === 'on_track' ? 'On track' : 'Off track',
  ]);
  simpleTable(doc, head, rows, [160, 55, 60, 55, 55, 50, 60]);
}

function renderB4Unanticipated(doc: PDFKit.PDFDocument, data: QprData): void {
  doc.moveDown(1);
  greenBanner(doc, 'B.4 — Unanticipated or Additional results');
  if (data.narratives.unanticipated_results.length === 0) {
    placeholderLine(doc, 'None recorded.');
    return;
  }
  doc.font('Helvetica').fontSize(10).fillColor('black');
  for (const ur of data.narratives.unanticipated_results) {
    doc.font('Helvetica-Bold').text(`${ur.category}:`, { continued: true });
    doc.font('Helvetica').text(` ${ur.text}`);
    doc.moveDown(0.3);
  }
}

// ─── Section C ─────────────────────────────────────────────────────────────

function renderC11Covenants(doc: PDFKit.PDFDocument, data: QprData): void {
  doc.addPage();
  blueBanner(doc, 'C — PROJECT IMPLEMENTATION PROGRESS REPORTING');
  greenBanner(doc, 'C.1.1 — Compliance with project covenants');
  if (data.compliance.covenants.length === 0) {
    placeholderLine(doc, 'No covenants recorded.');
    return;
  }
  const head = ['Covenant', 'Type', 'Status', 'Comments'];
  const rows = data.compliance.covenants.map((c) => [
    c.covenant_text,
    c.type,
    c.status,
    c.comments || '—',
  ]);
  simpleTable(doc, head, rows, [220, 80, 70, 100]);
}

function renderC12Safeguards(doc: PDFKit.PDFDocument, data: QprData): void {
  doc.moveDown(1);
  greenBanner(
    doc,
    'C.1.2 — Compliance with environmental and social safeguards',
  );
  if (data.compliance.safeguards.length === 0) {
    placeholderLine(doc, 'No safeguard measures recorded.');
    return;
  }
  const head = [
    'Type',
    'Measure',
    'Total',
    'Not started',
    'Ongoing',
    'Completed',
    '% done',
    'Budget (UA)',
    'Disbursed (UA)',
  ];
  const rows = data.compliance.safeguards.map((s) => [
    s.type,
    s.measure_name,
    String(s.total_count),
    String(s.not_started_count),
    String(s.ongoing_count),
    String(s.completed_count),
    `${s.progress_pct}%`,
    fmtCurrency(s.budget_allocated_ua, ''),
    fmtCurrency(s.amount_disbursed_ua, ''),
  ]);
  simpleTable(doc, head, rows, [40, 110, 35, 50, 45, 55, 45, 65, 55]);
}

function renderC13AuditCompliance(
  doc: PDFKit.PDFDocument,
  data: QprData,
): void {
  doc.moveDown(1);
  greenBanner(doc, 'C.1.3 — Audit compliance');
  if (data.compliance.audit_findings.length === 0) {
    placeholderLine(doc, 'No outstanding audit findings.');
    return;
  }
  const head = [
    'Year',
    'Status',
    'Key issue',
    'Corrective measures',
    'Expected',
  ];
  const rows = data.compliance.audit_findings.map((a) => [
    String(a.year),
    a.audit_status,
    a.key_issue,
    a.corrective_measures || '—',
    a.expected_submission_date ?? '—',
  ]);
  simpleTable(doc, head, rows, [45, 70, 150, 150, 65]);
}

function renderC21Activities(doc: PDFKit.PDFDocument, data: QprData): void {
  doc.addPage();
  greenBanner(
    doc,
    `C.2.1 — Status of key activities during ${quarterLabel(data.period.year, data.period.quarter)}`,
  );
  if (data.awp_current_qtr.length === 0) {
    placeholderLine(doc, 'No AWP activity status entered for this quarter.');
    return;
  }
  const head = [
    'Component',
    'Activity',
    'Deadline',
    'Status',
    '% achieved',
    'Comments',
  ];
  const rows = data.awp_current_qtr.map((r) => [
    r.component_code ?? '—',
    `${r.node_code} ${r.node_title}`,
    r.deadline ?? '—',
    r.status,
    `${r.pct_achievement}%`,
    r.comments || '—',
  ]);
  simpleTable(doc, head, rows, [60, 180, 65, 70, 50, 90]);
}

function renderC22Activities(doc: PDFKit.PDFDocument, data: QprData): void {
  doc.moveDown(1);
  greenBanner(doc, 'C.2.2 — Planned key activities for next quarter');
  if (
    data.awp_next_qtr.length === 0 &&
    !data.narratives.awp_planned_next_qtr.trim()
  ) {
    placeholderLine(doc, 'None flagged for next quarter.');
    return;
  }
  if (data.narratives.awp_planned_next_qtr.trim()) {
    doc.font('Helvetica').fontSize(10).fillColor('black');
    doc.text(data.narratives.awp_planned_next_qtr, { align: 'justify' });
    doc.moveDown(0.4);
  }
  if (data.awp_next_qtr.length > 0) {
    const head = ['Component', 'Activity', 'Deadline'];
    const rows = data.awp_next_qtr.map((r) => [
      r.component_code ?? '—',
      `${r.node_code} ${r.node_title}`,
      r.deadline ?? '—',
    ]);
    simpleTable(doc, head, rows, [80, 260, 80]);
  }
}

function renderC3Placeholder(doc: PDFKit.PDFDocument): void {
  doc.addPage();
  greenBanner(doc, 'C.3 — Procurement performance');
  placeholderPanel(
    doc,
    'Procurement Unit',
    'Section to be completed outside the M&E system. Source: project procurement plan + SAP Ariba. Cover both C.3.1 (procurement plan implementation, time-to-no-objection metrics) and C.3.2 (ongoing-contracts management). Procurement plans for Goods / Works / Services attach as Annexes 2-4.',
  );
}

function renderC4Placeholder(doc: PDFKit.PDFDocument): void {
  doc.addPage();
  greenBanner(doc, 'C.4 — Project execution and financing');
  placeholderPanel(
    doc,
    'Finance Unit',
    'Section to be completed outside the M&E system. Source: project finance ledger + Bank SAP. Cover both C.4.1 (financial progress — disbursements by source, budget commitments, counterpart + co-financing) and C.4.2 (Revolving Fund justification). Year-by-year disbursement plan attaches as Annex 5.',
  );
}

function renderC5Stakeholders(doc: PDFKit.PDFDocument, data: QprData): void {
  doc.addPage();
  greenBanner(
    doc,
    'C.5 — Performance of Stakeholders during the previous quarter',
  );
  doc.font('Helvetica').fontSize(10).fillColor('black');
  const fmtAssessment = (label: string, text: string) => {
    doc.font('Helvetica-Bold').text(`${label}:`);
    doc.font('Helvetica');
    if (text.trim()) doc.text(text, { align: 'justify' });
    else placeholderLine(doc, 'Not yet entered.');
    doc.moveDown(0.4);
  };
  fmtAssessment(
    'Bank Performance',
    data.narratives.bank_performance_assessment,
  );
  fmtAssessment(
    'Borrower Performance',
    data.narratives.borrower_performance_assessment,
  );
  fmtAssessment(
    'Co-financier Performance',
    data.narratives.cofinancier_performance_assessment,
  );
  fmtAssessment('Project Management Team status', data.narratives.pmt_status);
}

// ─── Annexes ───────────────────────────────────────────────────────────────

function renderAnnex1(doc: PDFKit.PDFDocument, data: QprData): void {
  doc.addPage();
  blueBanner(doc, 'ANNEXES');
  greenBanner(doc, 'Annex 1 — Output projections and status');
  if (data.annex1.length === 0) {
    placeholderLine(doc, 'No output indicators defined yet.');
    return;
  }
  for (const row of data.annex1) {
    if (doc.y > doc.page.height - PAGE_MARGIN - 100) doc.addPage();
    doc.font('Helvetica-Bold').fontSize(10).fillColor('black');
    doc.text(`${row.output_code} — ${row.output_name}`);
    doc.font('Helvetica').fontSize(9).fillColor(MUTED);
    doc.text(`Baseline: ${row.baseline}`);
    doc.moveDown(0.2);
    const head = [
      'Year',
      'Original projection',
      'Updated projection',
      'Actual',
    ];
    const rows = row.years.map((y) => [
      String(y.year),
      y.original === null ? '—' : String(y.original),
      y.updated === null ? '—' : String(y.updated),
      y.actual === null ? '—' : String(y.actual),
    ]);
    simpleTable(doc, head, rows, [50, 130, 130, 100]);
    doc.moveDown(0.8);
  }
}

function renderAnnex2to5Placeholder(doc: PDFKit.PDFDocument): void {
  doc.addPage();
  greenBanner(doc, 'Annexes 2-5 — Procurement plans + disbursement plan');
  placeholderPanel(
    doc,
    'Procurement Unit + Finance Unit',
    'These annexes attach as separate workbooks at submission time. Their structure is fixed by the AfDB template (see request.pdf pages 15-18): Annex 2 — Goods, Annex 3 — Works, Annex 4 — Services (all per-package basic-data + bid timeline + contract award + implementation), Annex 5 — Disbursement and commitment plan year by year per financing source. The M&E system does not generate these — owned by the source teams.',
  );
}

// ─── Layout helpers ────────────────────────────────────────────────────────

function blueBanner(doc: PDFKit.PDFDocument, title: string): void {
  if (doc.y > PAGE_MARGIN + 4) doc.moveDown(0.4);
  const y = doc.y;
  doc
    .rect(PAGE_MARGIN, y, doc.page.width - 2 * PAGE_MARGIN, 22)
    .fill(HEADER_BG);
  doc
    .fillColor('white')
    .font('Helvetica-Bold')
    .fontSize(13)
    .text(title, PAGE_MARGIN + 8, y + 5, {
      width: doc.page.width - 2 * PAGE_MARGIN - 16,
    });
  doc.fillColor('black').moveDown(0.6);
}

function greenBanner(doc: PDFKit.PDFDocument, title: string): void {
  if (doc.y > PAGE_MARGIN + 4) doc.moveDown(0.3);
  const y = doc.y;
  doc
    .rect(PAGE_MARGIN, y, doc.page.width - 2 * PAGE_MARGIN, 18)
    .fill(SECTION_BG);
  doc
    .fillColor('white')
    .font('Helvetica-Bold')
    .fontSize(11)
    .text(title, PAGE_MARGIN + 8, y + 3, {
      width: doc.page.width - 2 * PAGE_MARGIN - 16,
    });
  doc.fillColor('black').moveDown(0.5);
}

function kvTable(doc: PDFKit.PDFDocument, rows: [string, string][]): void {
  const leftWidth = 170;
  const rightWidth = doc.page.width - 2 * PAGE_MARGIN - leftWidth;
  doc.font('Helvetica').fontSize(10);
  for (const [k, v] of rows) {
    const startY = doc.y;
    doc.fillColor('#dbeafe').rect(PAGE_MARGIN, startY, leftWidth, 18).fill();
    doc
      .fillColor('black')
      .font('Helvetica-Bold')
      .text(k, PAGE_MARGIN + 6, startY + 4, { width: leftWidth - 12 });
    doc.font('Helvetica').text(v, PAGE_MARGIN + leftWidth + 6, startY + 4, {
      width: rightWidth - 12,
    });
    const used = Math.max(18, doc.y - startY);
    doc.y = startY + used + 2;
  }
}

function simpleTable(
  doc: PDFKit.PDFDocument,
  head: string[],
  rows: (string | number)[][],
  widths: number[],
): void {
  const tableLeft = PAGE_MARGIN;
  doc.font('Helvetica-Bold').fontSize(9).fillColor('white');
  let x = tableLeft;
  const headerY = doc.y;
  for (let i = 0; i < head.length; i += 1) {
    doc.rect(x, headerY, widths[i], 18).fill('#0f3a82');
    doc.fillColor('white').text(head[i], x + 4, headerY + 4, {
      width: widths[i] - 8,
    });
    x += widths[i];
  }
  doc.y = headerY + 18;
  doc.fillColor('black').font('Helvetica').fontSize(8);
  for (const row of rows) {
    if (doc.y > doc.page.height - PAGE_MARGIN - 20) doc.addPage();
    const rowY = doc.y;
    let cx = tableLeft;
    let maxH = 14;
    for (let i = 0; i < row.length; i += 1) {
      const txt = String(row[i] ?? '—');
      const h = doc.heightOfString(txt, { width: widths[i] - 8 });
      maxH = Math.max(maxH, h + 6);
    }
    cx = tableLeft;
    for (let i = 0; i < row.length; i += 1) {
      doc.rect(cx, rowY, widths[i], maxH).stroke('#cbd5e1');
      doc.text(String(row[i] ?? '—'), cx + 4, rowY + 3, {
        width: widths[i] - 8,
      });
      cx += widths[i];
    }
    doc.y = rowY + maxH;
  }
}

function placeholderLine(doc: PDFKit.PDFDocument, msg: string): void {
  doc.font('Helvetica-Oblique').fontSize(10).fillColor(MUTED);
  doc.text(msg);
  doc.fillColor('black');
}

function placeholderPanel(
  doc: PDFKit.PDFDocument,
  owner: string,
  description: string,
): void {
  doc.moveDown(0.4);
  const startY = doc.y;
  const h = 100;
  doc
    .rect(PAGE_MARGIN, startY, doc.page.width - 2 * PAGE_MARGIN, h)
    .fillAndStroke('#fef3c7', '#fbbf24');
  doc.fillColor('black').font('Helvetica-Bold').fontSize(10);
  doc.text(`Owned by ${owner}`, PAGE_MARGIN + 10, startY + 8, {
    width: doc.page.width - 2 * PAGE_MARGIN - 20,
  });
  doc.font('Helvetica').fontSize(9).fillColor('#7c2d12');
  doc.text(description, PAGE_MARGIN + 10, startY + 26, {
    width: doc.page.width - 2 * PAGE_MARGIN - 20,
  });
  doc.y = startY + h + 8;
  doc.fillColor('black');
}
