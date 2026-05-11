/**
 * Phase 9 — AfDB twice-yearly supervision PDF template.
 *
 * Renders a SupervisionData payload (see reports.service.ts) into a PDF
 * buffer using PDFKit. Built-in Helvetica/Helvetica-Bold fonts only —
 * custom fonts would require asset bundling and deploy-side font config,
 * which is over-scope for v1.
 *
 * Layout sequence:
 *   1. Cover page — project name, SAP code, PDO, period (baseline → now → completion).
 *   2. Executive summary — KPIs from preview.executive_summary + data_quality.
 *   3. Components — one section per component card (title, budget envelope,
 *      progress %, indicator status breakdown, child output-statement codes).
 *   4. Logframe rollup — indented rows mirroring logframe_rows.
 *   5. Indicator detail — code, name, baseline/target/current, expected_at_now,
 *      status, year-target sparkline, disaggregation rollup (when present).
 *   6. Evidence index — appendix listing every evidence document with title,
 *      type, indicator code, file_url.
 */

import PDFDocument from 'pdfkit';
import type { SupervisionData } from '../reports.service.js';

const PAGE_MARGIN = 48;
const EKZ_GREEN = '#1d6a4a';
const AMBER = '#b45309';
const RED = '#b91c1c';
const MUTED = '#6b7280';

function statusColor(status: string): string {
  if (status === 'on_track') return EKZ_GREEN;
  if (status === 'at_risk') return AMBER;
  return RED;
}

function fmtCurrency(value: number, currency: string): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency || 'USD',
    maximumFractionDigits: 0,
  }).format(value);
}

export async function renderAfdbSupervisionPdf(
  data: SupervisionData,
): Promise<Buffer> {
  const doc = new PDFDocument({
    size: 'A4',
    margin: PAGE_MARGIN,
    info: {
      Title: `AfDB Supervision Report — ${data.cover?.name ?? 'EKZ M&E'}`,
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
  renderExecutiveSummary(doc, data);
  renderComponents(doc, data);
  renderLogframeRollup(doc, data);
  renderIndicatorDetail(doc, data);
  renderEvidenceIndex(doc, data);

  doc.end();
  return done;
}

// ─── Sections ──────────────────────────────────────────────────────────────

function renderCover(doc: PDFKit.PDFDocument, data: SupervisionData): void {
  doc.font('Helvetica-Bold').fontSize(10).fillColor(MUTED);
  doc.text('AfDB SUPERVISION REPORT', { align: 'center' });
  doc.moveDown(8);

  doc.font('Helvetica-Bold').fontSize(28).fillColor(EKZ_GREEN);
  doc.text(data.cover?.name ?? 'EKZ Monitoring & Evaluation', {
    align: 'center',
  });
  doc.moveDown(0.5);

  if (data.cover?.sap_code) {
    doc.font('Helvetica').fontSize(12).fillColor(MUTED);
    doc.text(`SAP code: ${data.cover.sap_code}`, { align: 'center' });
  }
  doc.moveDown(3);

  if (data.cover) {
    doc.font('Helvetica-Bold').fontSize(11).fillColor('black');
    doc.text('Project Development Objective', PAGE_MARGIN, doc.y);
    doc.moveDown(0.5);
    doc
      .font('Helvetica')
      .fontSize(11)
      .fillColor('black')
      .text(data.cover.pdo_text, { align: 'justify' });
    doc.moveDown(2);

    doc.font('Helvetica-Bold').fontSize(11);
    doc.text('Period');
    doc.moveDown(0.3);
    doc
      .font('Helvetica')
      .fontSize(11)
      .text(
        `Baseline year: ${data.cover.baseline_year}     Completion year: ${data.cover.completion_year}` +
          (data.cover.midpoint_date
            ? `     Midpoint date: ${data.cover.midpoint_date}`
            : ''),
      );
  } else {
    doc.font('Helvetica').fontSize(11).fillColor(MUTED);
    doc.text(
      'Project metadata not yet configured. Run /admin/project-meta to populate the cover page.',
      { align: 'center' },
    );
  }

  doc.moveDown(4);
  doc.font('Helvetica').fontSize(9).fillColor(MUTED);
  doc.text(
    `Generated ${new Date(data.meta.generated_at).toISOString().slice(0, 10)} by ${data.meta.generated_by}`,
    { align: 'center' },
  );
}

function renderExecutiveSummary(
  doc: PDFKit.PDFDocument,
  data: SupervisionData,
): void {
  doc.addPage();
  sectionHeader(doc, 'Executive Summary');

  const s = data.executive_summary;
  const kpis: { label: string; value: string; color?: string }[] = [
    { label: 'Total indicators', value: String(s.total_indicators) },
    {
      label: 'On track',
      value: `${s.on_track} (${s.on_track_pct}%)`,
      color: EKZ_GREEN,
    },
    { label: 'At risk', value: String(s.at_risk), color: AMBER },
    { label: 'Off track', value: String(s.off_track), color: RED },
    { label: 'Total submissions', value: String(s.total_submissions) },
    {
      label: 'Approved submissions',
      value: `${s.approved_submissions} (${s.data_verified_pct}% verified)`,
    },
    {
      label: 'Off-site submissions',
      value: String(s.off_site_submissions),
    },
  ];

  doc.font('Helvetica').fontSize(11).fillColor('black');
  for (const kpi of kpis) {
    doc.fillColor(MUTED).text(kpi.label, { continued: true, indent: 8 });
    doc
      .fillColor(kpi.color ?? 'black')
      .text(`  ${kpi.value}`, { align: 'right' });
  }
}

function renderComponents(
  doc: PDFKit.PDFDocument,
  data: SupervisionData,
): void {
  if (data.components.length === 0) return;
  doc.addPage();
  sectionHeader(doc, 'Components');

  for (const c of data.components) {
    if (doc.y > doc.page.height - PAGE_MARGIN - 120) doc.addPage();

    doc.font('Helvetica-Bold').fontSize(13).fillColor(EKZ_GREEN);
    doc.text(`${c.code} — ${c.title}`);
    doc.moveDown(0.3);

    doc.font('Helvetica').fontSize(10).fillColor(MUTED);
    const budgetLine =
      c.budget_usd !== null
        ? `Budget envelope: ${fmtCurrency(c.budget_usd, c.budget_currency)}`
        : 'Budget envelope: not yet wired';
    doc.text(budgetLine);
    doc.text(
      `Indicators: ${c.indicator_count}     Progress: ${c.progress_pct}%`,
    );
    doc.fillColor(EKZ_GREEN).text(`On track: ${c.on_track}`, {
      continued: true,
    });
    doc.fillColor(AMBER).text(`     At risk: ${c.at_risk}`, {
      continued: true,
    });
    doc.fillColor(RED).text(`     Off track: ${c.off_track}`);

    if (c.output_statement_codes.length > 0) {
      doc.moveDown(0.3);
      doc
        .fillColor(MUTED)
        .text(`Output statements: ${c.output_statement_codes.join(', ')}`);
    }

    doc.moveDown(1);
  }
}

function renderLogframeRollup(
  doc: PDFKit.PDFDocument,
  data: SupervisionData,
): void {
  if (data.logframe_rows.length === 0) return;
  doc.addPage();
  sectionHeader(doc, 'Logframe Rollup');

  doc.font('Helvetica').fontSize(10).fillColor('black');
  for (const row of data.logframe_rows) {
    if (doc.y > doc.page.height - PAGE_MARGIN - 30) doc.addPage();
    const indent = PAGE_MARGIN + row.depth * 12;
    doc.font('Helvetica-Bold').fontSize(10).fillColor('black');
    doc.text(
      `${row.type.toUpperCase().padEnd(18)} ${row.code}  ${row.title}`,
      indent,
      doc.y,
    );
    if (row.indicators.length === 0) {
      doc
        .font('Helvetica')
        .fontSize(9)
        .fillColor(MUTED)
        .text('(no indicators)', indent + 18, doc.y);
    } else {
      for (const ind of row.indicators) {
        doc
          .font('Helvetica')
          .fontSize(9)
          .fillColor(statusColor(ind.status))
          .text(
            `${ind.code} — ${ind.name}  •  ${ind.current_value}/${ind.target} ${ind.unit} (${ind.progress_pct}%)  •  expected ${ind.expected_at_now}`,
            indent + 18,
            doc.y,
          );
      }
    }
    doc.moveDown(0.4);
  }
}

function renderIndicatorDetail(
  doc: PDFKit.PDFDocument,
  data: SupervisionData,
): void {
  const allIndicators = data.logframe_rows.flatMap((r) => r.indicators);
  if (allIndicators.length === 0) return;
  doc.addPage();
  sectionHeader(doc, 'Indicator Detail');

  for (const ind of allIndicators) {
    if (doc.y > doc.page.height - PAGE_MARGIN - 160) doc.addPage();

    doc.font('Helvetica-Bold').fontSize(11).fillColor('black');
    doc.text(`${ind.code} — ${ind.name}`);
    doc.font('Helvetica').fontSize(9).fillColor(MUTED);
    doc.text(
      `Responsible: ${ind.responsible_party}     Frequency: ${ind.frequency}     MoV: ${ind.means_of_verification}`,
    );
    doc.moveDown(0.3);

    doc.font('Helvetica').fontSize(10).fillColor('black');
    doc.text(
      `Baseline ${ind.baseline} · Target ${ind.target} · Current ${ind.current_value} ${ind.unit}`,
    );
    doc.text(
      `Expected at now: ${ind.expected_at_now}${ind.expected_at_completion !== null ? `   ·   Expected at completion: ${ind.expected_at_completion}` : ''}`,
    );
    doc.fillColor(statusColor(ind.status)).text(`Status: ${ind.status}`);
    doc.fillColor('black');

    if (ind.year_targets.length > 0) {
      doc.font('Helvetica').fontSize(9).fillColor(MUTED);
      const ytLine = ind.year_targets
        .map((yt) => `${yt.year}: ${yt.target_value}`)
        .join('   ');
      doc.text(`Year targets — ${ytLine}`);
    }

    const rollups = data.disaggregation_by_indicator[ind.id];
    if (rollups && rollups.length > 0) {
      doc.font('Helvetica-Bold').fontSize(9).fillColor('black');
      doc.text('Disaggregation:');
      doc.font('Helvetica').fontSize(9).fillColor('black');
      for (const r of rollups) {
        const bucketLine = Object.entries(r.buckets)
          .map(([k, v]) => `${k}=${v}`)
          .join(', ');
        doc.text(
          `  ${r.axis} — total ${r.total}  •  ${bucketLine || '(no entries)'}`,
        );
      }
    }

    doc.moveDown(0.6);
  }
}

function renderEvidenceIndex(
  doc: PDFKit.PDFDocument,
  data: SupervisionData,
): void {
  const allEvidence = data.logframe_rows.flatMap((r) =>
    r.indicators.flatMap((i) =>
      i.evidence.map((e) => ({ ...e, indicator_code: i.code })),
    ),
  );
  if (allEvidence.length === 0) return;
  doc.addPage();
  sectionHeader(doc, 'Evidence Index');

  doc.font('Helvetica').fontSize(9).fillColor('black');
  for (const e of allEvidence) {
    if (doc.y > doc.page.height - PAGE_MARGIN - 20) doc.addPage();
    doc.font('Helvetica-Bold').fillColor('black').text(e.title);
    doc
      .font('Helvetica')
      .fillColor(MUTED)
      .text(`${e.document_type}   ·   ${e.indicator_code}   ·   ${e.file_url}`);
    doc.moveDown(0.3);
  }
}

// ─── Helpers ───────────────────────────────────────────────────────────────

function sectionHeader(doc: PDFKit.PDFDocument, title: string): void {
  doc.font('Helvetica-Bold').fontSize(16).fillColor(EKZ_GREEN);
  doc.text(title);
  doc
    .moveTo(PAGE_MARGIN, doc.y)
    .lineTo(doc.page.width - PAGE_MARGIN, doc.y)
    .strokeColor(EKZ_GREEN)
    .lineWidth(1)
    .stroke();
  doc.moveDown(0.6);
}
