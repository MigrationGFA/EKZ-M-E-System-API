import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, IsNull, Repository } from 'typeorm';
import { Report } from './report.entity.js';
import { Indicator } from '../indicators/indicator.entity.js';
import { IndicatorProgress } from '../indicators/indicator-progress.entity.js';
import { IndicatorYearTarget } from '../indicators/indicator-year-target.entity.js';
import { Submission } from '../submissions/submission.entity.js';
import { LogframeNode } from '../logframe/logframe-node.entity.js';
import { EvidenceDocument } from '../evidence/evidence-document.entity.js';
import type { DocumentType } from '../evidence/evidence-document.entity.js';
import { MailService } from '../mail/mail.service.js';
import { AuditService } from '../audit/audit.service.js';
import { ProjectMetaService } from '../project-meta/project-meta.service.js';
import { expectedAt } from '../indicators/helpers/expected-progress.js';
import { DisaggregationService } from '../indicators/disaggregation.service.js';
import { DisaggregationAxis } from '../indicators/dto/disaggregation.dto.js';
import { AzureStorageService } from '../storage/azure-storage.service.js';
import { renderAfdbQprPdf } from './templates/afdb-qpr.js';
import { ProjectFinancingSource } from '../project-financing-sources/project-financing-source.entity.js';
import { ProjectRisk } from '../project-risks/project-risk.entity.js';
import { ProjectCovenant } from '../compliance/covenants/project-covenant.entity.js';
import { SafeguardMeasure } from '../compliance/safeguards/safeguard-measure.entity.js';
import { AuditFinding } from '../compliance/audit-findings/audit-finding.entity.js';
import { ActivityQuarterlyStatus } from '../awp-status/activity-quarterly-status.entity.js';
import { QuarterlyReportsService } from '../quarterly-reports/quarterly-reports.service.js';

// Phase 9: Azure container reuse — supervision PDFs live alongside Phase 6
// evidence documents in `wiftdocuments`, keyed under `reports/`. Single
// container = single RBAC posture + single lifecycle policy.
const REPORTS_CONTAINER = 'wiftdocuments';
const REPORTS_KEY_PREFIX = 'reports';

interface ProjectAnchors {
  baselineDate?: Date;
  completionDate?: Date;
}

interface YearTargetRow {
  year: number;
  target_value: number;
  notes: string | null;
}

interface SubCounts {
  total: number;
  approved: number;
  rejected: number;
  pending: number;
}

interface EvidenceRow {
  id: string;
  title: string;
  document_type: DocumentType;
  file_url: string;
}

interface IndicatorReportRow {
  id: string;
  code: string;
  name: string;
  unit: string;
  baseline: number;
  target: number;
  current_value: number;
  progress_pct: number;
  status: string;
  responsible_party: string;
  means_of_verification: string;
  frequency: string;
  trend: { date: string; value: number }[];
  submissions: SubCounts;
  year_targets: YearTargetRow[];
  expected_at_now: number;
  expected_at_completion: number | null;
  evidence: EvidenceRow[];
}

interface LogframeReportRow {
  depth: number;
  type: string;
  code: string;
  title: string;
  indicators: IndicatorReportRow[];
}

// ─── Phase 9 supervision payload ────────────────────────────────────────────

export interface SupervisionCover {
  name: string;
  sap_code: string | null;
  pdo_text: string;
  baseline_year: number;
  completion_year: number;
  midpoint_date: string | null;
}

export interface DisaggregationRollupRow {
  axis: string;
  total: number;
  buckets: Record<string, number>;
  target: Record<string, number> | null;
  gap: Record<string, number> | null;
}

export interface ComponentReportRow {
  id: string;
  code: string;
  title: string;
  budget_usd: number | null;
  budget_currency: string;
  indicator_count: number;
  on_track: number;
  at_risk: number;
  off_track: number;
  progress_pct: number;
  output_statement_codes: string[];
}

export interface SupervisionData extends ReportPreviewData {
  cover: SupervisionCover | null;
  components: ComponentReportRow[];
  disaggregation_by_indicator: Record<string, DisaggregationRollupRow[]>;
}

// ─── Phase 9.5 QPR payload ──────────────────────────────────────────────────

export interface QprCover extends SupervisionCover {
  sector: string | null;
  country: string;
  executing_agency: string | null;
  responsible_project_staff: string | null;
  original_disbursement_deadline: string | null;
  revised_disbursement_deadline: string | null;
  financing_sources: {
    source_name: string;
    instrument: string;
    total_approved_ua: number;
    disbursed_ua: number;
    disbursed_pct: number;
  }[];
}

export interface QprRiskRow {
  key_issue: string;
  corrective_action: string;
  responsibility: string;
  deadline: string | null;
  status: string;
  comments: string;
}

export interface QprNarratives {
  executive_summary: string;
  pdo_assessment: string;
  unanticipated_results: { category: string; text: string }[];
  bank_performance_assessment: string;
  borrower_performance_assessment: string;
  cofinancier_performance_assessment: string;
  pmt_status: string;
  awp_planned_next_qtr: string;
}

export interface QprAwpRow {
  node_code: string;
  node_title: string;
  component_code: string | null;
  deadline: string | null;
  status: string;
  pct_achievement: number;
  comments: string;
}

export interface QprComplianceBundle {
  covenants: {
    covenant_text: string;
    type: string;
    status: string;
    comments: string;
  }[];
  safeguards: {
    type: string;
    measure_name: string;
    total_count: number;
    not_started_count: number;
    ongoing_count: number;
    completed_count: number;
    budget_allocated_ua: number;
    amount_disbursed_ua: number;
    progress_pct: number;
  }[];
  audit_findings: {
    year: number;
    audit_status: string;
    key_issue: string;
    corrective_measures: string;
    comments: string;
    expected_submission_date: string | null;
  }[];
}

export interface QprAnnex1Row {
  output_code: string;
  output_name: string;
  baseline: number;
  years: {
    year: number;
    original: number | null;
    updated: number | null;
    actual: number | null;
  }[];
}

export interface QprData extends SupervisionData {
  period: { year: number; quarter: number };
  cover: QprCover | null;
  risks: QprRiskRow[];
  narratives: QprNarratives;
  awp_current_qtr: QprAwpRow[];
  awp_next_qtr: QprAwpRow[];
  compliance: QprComplianceBundle;
  annex1: QprAnnex1Row[];
}

export interface ReportPreviewData {
  meta: {
    generated_at: string;
    generated_by: string;
    date_from: string | null;
    date_to: string | null;
  };
  executive_summary: {
    total_indicators: number;
    on_track: number;
    at_risk: number;
    off_track: number;
    on_track_pct: number;
    total_submissions: number;
    approved_submissions: number;
    pending_submissions: number;
    rejected_submissions: number;
    off_site_submissions: number;
    data_verified_pct: number;
  };
  logframe_rows: LogframeReportRow[];
  data_quality: {
    total_submissions: number;
    approved_count: number;
    rejected_count: number;
    pending_count: number;
    off_site_count: number;
    verified_pct: number;
  };
}

@Injectable()
export class ReportsService {
  constructor(
    @InjectRepository(Report)
    private readonly reportRepo: Repository<Report>,
    @InjectRepository(Indicator)
    private readonly indicatorRepo: Repository<Indicator>,
    @InjectRepository(IndicatorProgress)
    private readonly progressRepo: Repository<IndicatorProgress>,
    @InjectRepository(IndicatorYearTarget)
    private readonly yearTargetsRepo: Repository<IndicatorYearTarget>,
    @InjectRepository(Submission)
    private readonly subRepo: Repository<Submission>,
    @InjectRepository(LogframeNode)
    private readonly nodeRepo: Repository<LogframeNode>,
    @InjectRepository(EvidenceDocument)
    private readonly evidenceRepo: Repository<EvidenceDocument>,
    private readonly mailService: MailService,
    private readonly auditService: AuditService,
    private readonly projectMetaService: ProjectMetaService,
    private readonly disaggregationService: DisaggregationService,
    private readonly azureStorage: AzureStorageService,
    @InjectRepository(ProjectFinancingSource)
    private readonly financingRepo: Repository<ProjectFinancingSource>,
    @InjectRepository(ProjectRisk)
    private readonly risksRepo: Repository<ProjectRisk>,
    @InjectRepository(ProjectCovenant)
    private readonly covenantsRepo: Repository<ProjectCovenant>,
    @InjectRepository(SafeguardMeasure)
    private readonly safeguardsRepo: Repository<SafeguardMeasure>,
    @InjectRepository(AuditFinding)
    private readonly auditFindingsRepo: Repository<AuditFinding>,
    @InjectRepository(ActivityQuarterlyStatus)
    private readonly awpRepo: Repository<ActivityQuarterlyStatus>,
    private readonly quarterlyReportsService: QuarterlyReportsService,
  ) {}

  async findAll() {
    const reports = await this.reportRepo.find({
      order: { created_at: 'DESC' },
    });
    return reports.map((r) => ({
      id: r.id,
      title: r.title,
      generatedBy: r.generated_by,
      generatedAt: r.generated_at,
      format: r.format,
      filters: r.filters,
      downloadUrl: r.download_url,
    }));
  }

  async generate(
    title: string,
    format: string,
    generatedBy: string,
    filters: Record<string, any>,
    generatorEmail: string,
    actorId: string,
  ) {
    const report = this.reportRepo.create({
      title,
      format,
      generated_by: generatedBy,
      generated_at: new Date(),
      filters,
      download_url: '#',
    });
    const saved = await this.reportRepo.save(report);

    // Phase 9/9.5: server-side PDF generation. Excel stays client-side —
    // this endpoint only records metadata for non-PDF formats and the
    // client handles the XLSX download.
    //
    // Phase 9.5 swaps the AfDB supervision template for the QPR template
    // when a year+quarter are present in filters. Without year+quarter,
    // generation defaults to the QPR shape against the current period
    // (the supervision template is deprecated; afdb-supervision.ts stays
    // as a re-export shim for one release cycle).
    let downloadUrl = '#';
    if (format === 'pdf') {
      const now = new Date();
      const year =
        typeof filters.year === 'number' ? filters.year : now.getUTCFullYear();
      const quarter =
        typeof filters.quarter === 'number'
          ? filters.quarter
          : Math.floor(now.getUTCMonth() / 3) + 1;

      const data = await this.getQprData(
        year,
        quarter,
        generatedBy,
        actorId,
        generatorEmail,
      );
      const buffer = await renderAfdbQprPdf(data);
      const key = `${REPORTS_KEY_PREFIX}/${saved.id}.pdf`;
      downloadUrl = await this.azureStorage.uploadDocument(
        REPORTS_CONTAINER,
        key,
        buffer,
        'application/pdf',
      );
      saved.download_url = downloadUrl;
      await this.reportRepo.save(saved);

      // Stamp the QPR record's generated_at/by so admin form shows last-gen.
      await this.quarterlyReportsService.markGenerated(
        year,
        quarter,
        generatedBy,
      );
    }

    void this.auditService.log({
      user_id: actorId,
      user_name: generatorEmail,
      action: 'create',
      resource: 'report',
      resource_id: saved.id,
      after_data: { title, format, filters, generated_by: generatedBy },
    });

    void this.mailService.sendReportReady(
      generatorEmail,
      generatedBy,
      title,
      format,
    );

    return {
      report_id: saved.id,
      download_url: downloadUrl,
      format: saved.format,
    };
  }

  async getPreviewData(
    generatedBy: string,
    dateFrom?: string,
    dateTo?: string,
  ): Promise<ReportPreviewData> {
    const [indicators, nodes, yearTargetsByIndicator, anchors] =
      await Promise.all([
        this.indicatorRepo.find(),
        this.nodeRepo.find({ order: { order: 'ASC' } }),
        this.loadYearTargetsMap(),
        this.resolveProjectAnchors(),
      ]);

    const progressByIndicator = await this.loadProgressMap(dateFrom, dateTo);
    const subsByIndicator = await this.loadSubsByIndicatorMap(dateFrom, dateTo);
    const globalStats = await this.loadGlobalSubStats(dateFrom, dateTo);
    const evidenceByIndicator = await this.loadEvidenceByIndicatorMap();

    const { totalSubs, approvedSubs, rejectedSubs, pendingSubs, offSiteSubs } =
      globalStats;
    const verifiedPct =
      totalSubs > 0 ? Math.round((approvedSubs / totalSubs) * 100) : 0;

    let onTrack = 0;
    let atRisk = 0;
    let offTrack = 0;
    for (const ind of indicators) {
      if (ind.status === 'on_track') onTrack++;
      else if (ind.status === 'at_risk') atRisk++;
      else offTrack++;
    }

    const logframe_rows = this.buildLogframeRows(
      nodes,
      indicators,
      progressByIndicator,
      subsByIndicator,
      yearTargetsByIndicator,
      evidenceByIndicator,
      anchors,
    );

    return {
      meta: {
        generated_at: new Date().toISOString(),
        generated_by: generatedBy,
        date_from: dateFrom ?? null,
        date_to: dateTo ?? null,
      },
      executive_summary: {
        total_indicators: indicators.length,
        on_track: onTrack,
        at_risk: atRisk,
        off_track: offTrack,
        on_track_pct:
          indicators.length > 0
            ? Math.round((onTrack / indicators.length) * 100)
            : 0,
        total_submissions: totalSubs,
        approved_submissions: approvedSubs,
        pending_submissions: pendingSubs,
        rejected_submissions: rejectedSubs,
        off_site_submissions: offSiteSubs,
        data_verified_pct: verifiedPct,
      },
      logframe_rows,
      data_quality: {
        total_submissions: totalSubs,
        approved_count: approvedSubs,
        rejected_count: rejectedSubs,
        pending_count: pendingSubs,
        off_site_count: offSiteSubs,
        verified_pct: verifiedPct,
      },
    };
  }

  /**
   * Phase 9: aggregates everything the AfDB supervision PDF needs in one
   * call — preview shape + cover (from project_meta) + component rollups
   * (filtered from logframe_rows + aggregated) + per-indicator
   * disaggregation rollups (DisaggregationService.getRollup per axis).
   *
   * Disaggregation loading is per (indicator, axis) — supervision is a
   * twice-yearly cadence and the data volume is modest. If the N+M cost
   * becomes a problem the rollup query can be batched in SQL later.
   */
  async getSupervisionData(
    generatedBy: string,
    dateFrom?: string,
    dateTo?: string,
  ): Promise<SupervisionData> {
    const preview = await this.getPreviewData(generatedBy, dateFrom, dateTo);
    const cover = await this.loadSupervisionCover();
    const components = await this.buildComponentRows();
    const disaggregation_by_indicator =
      await this.loadDisaggregationByIndicator();

    return {
      ...preview,
      cover,
      components,
      disaggregation_by_indicator,
    };
  }

  /**
   * Phase 9.5 — assemble the QPR payload. Extends SupervisionData with
   * widened cover, risks register, narratives (per (year, quarter)),
   * current + next-quarter AWP status, compliance bundle, and the
   * Annex-1 output-projection matrix (original vs updated vs actual
   * per year per output).
   *
   * Procurement (C.3 + Annexes 2-4) and Financial disbursement (C.4 +
   * Annex 5) are deliberately not assembled here — those render as
   * placeholders in the QPR PDF.
   */
  async getQprData(
    year: number,
    quarter: number,
    generatedBy: string,
    actorId: string,
    actorName: string,
  ): Promise<QprData> {
    const supervision = await this.getSupervisionData(generatedBy);
    const cover = await this.loadQprCover();
    const risks = await this.loadActiveRisks();
    const narratives = await this.loadNarratives(
      year,
      quarter,
      actorId,
      actorName,
    );
    const { current: awp_current_qtr, next: awp_next_qtr } =
      await this.loadAwpStatus(year, quarter);
    const compliance = await this.loadCompliance();
    const annex1 = await this.buildAnnex1();

    return {
      ...supervision,
      cover,
      period: { year, quarter },
      risks,
      narratives,
      awp_current_qtr,
      awp_next_qtr,
      compliance,
      annex1,
    };
  }

  private async loadQprCover(): Promise<QprCover | null> {
    try {
      const meta = await this.projectMetaService.get();
      const sources = await this.financingRepo.find({
        order: { order: 'ASC', source_name: 'ASC' },
      });
      return {
        name: meta.name,
        sap_code: meta.sap_code,
        pdo_text: meta.pdo_text,
        baseline_year: meta.baseline_year,
        completion_year: meta.completion_year,
        midpoint_date: meta.midpoint_date
          ? new Date(meta.midpoint_date).toISOString().slice(0, 10)
          : null,
        sector: meta.sector,
        country: meta.country,
        executing_agency: meta.executing_agency,
        responsible_project_staff: meta.responsible_project_staff,
        original_disbursement_deadline: meta.original_disbursement_deadline
          ? new Date(meta.original_disbursement_deadline)
              .toISOString()
              .slice(0, 10)
          : null,
        revised_disbursement_deadline: meta.revised_disbursement_deadline
          ? new Date(meta.revised_disbursement_deadline)
              .toISOString()
              .slice(0, 10)
          : null,
        financing_sources: sources.map((s) => ({
          source_name: s.source_name,
          instrument: s.instrument,
          total_approved_ua: s.total_approved_ua,
          disbursed_ua: s.disbursed_ua,
          disbursed_pct:
            s.total_approved_ua > 0
              ? Math.round((s.disbursed_ua / s.total_approved_ua) * 100)
              : 0,
        })),
      };
    } catch (e) {
      if (e instanceof NotFoundException) return null;
      throw e;
    }
  }

  private async loadActiveRisks(): Promise<QprRiskRow[]> {
    const rows = await this.risksRepo.find({
      where: { resolved_at: IsNull() },
      order: { deadline: 'ASC', created_at: 'DESC' },
    });
    return rows.map((r) => ({
      key_issue: r.key_issue,
      corrective_action: r.corrective_action,
      responsibility: r.responsibility,
      deadline: r.deadline
        ? new Date(r.deadline).toISOString().slice(0, 10)
        : null,
      status: r.status,
      comments: r.comments,
    }));
  }

  private async loadNarratives(
    year: number,
    quarter: number,
    actorId: string,
    actorName: string,
  ): Promise<QprNarratives> {
    const row = await this.quarterlyReportsService.getOrCreate(
      year,
      quarter,
      actorId,
      actorName,
    );
    return {
      executive_summary: row.executive_summary,
      pdo_assessment: row.pdo_assessment,
      unanticipated_results: row.unanticipated_results ?? [],
      bank_performance_assessment: row.bank_performance_assessment,
      borrower_performance_assessment: row.borrower_performance_assessment,
      cofinancier_performance_assessment:
        row.cofinancier_performance_assessment,
      pmt_status: row.pmt_status,
      awp_planned_next_qtr: row.awp_planned_next_qtr,
    };
  }

  private async loadAwpStatus(
    year: number,
    quarter: number,
  ): Promise<{ current: QprAwpRow[]; next: QprAwpRow[] }> {
    const rows = await this.awpRepo.find({
      where: { year, quarter },
      order: { created_at: 'ASC' },
    });
    if (rows.length === 0) return { current: [], next: [] };
    const nodeIds = Array.from(new Set(rows.map((r) => r.logframe_node_id)));
    const nodes = await this.nodeRepo.find({ where: { id: In(nodeIds) } });
    const nodeMap = new Map(nodes.map((n) => [n.id, n]));
    // Build component lookup for context — walk parents to find the
    // nearest 'component' ancestor.
    const allNodes = await this.nodeRepo.find();
    const allMap = new Map(allNodes.map((n) => [n.id, n]));
    const componentCodeFor = (id: string): string | null => {
      let cursor = allMap.get(id) ?? null;
      let depth = 0;
      while (cursor && depth < 10) {
        if (cursor.type === 'component') return cursor.code;
        cursor = cursor.parent_id
          ? (allMap.get(cursor.parent_id) ?? null)
          : null;
        depth += 1;
      }
      return null;
    };
    const toRow = (r: ActivityQuarterlyStatus): QprAwpRow => {
      const node = nodeMap.get(r.logframe_node_id);
      return {
        node_code: node?.code ?? '—',
        node_title: node?.title ?? '(unknown activity)',
        component_code: componentCodeFor(r.logframe_node_id),
        deadline: r.deadline
          ? new Date(r.deadline).toISOString().slice(0, 10)
          : null,
        status: r.status,
        pct_achievement: r.pct_achievement,
        comments: r.comments,
      };
    };
    return {
      current: rows.map(toRow),
      next: rows.filter((r) => r.planned_for_next_qtr).map(toRow),
    };
  }

  private async loadCompliance(): Promise<QprComplianceBundle> {
    const [covenants, safeguards, findings] = await Promise.all([
      this.covenantsRepo.find({ order: { order: 'ASC', created_at: 'ASC' } }),
      this.safeguardsRepo.find({ order: { order: 'ASC', type: 'ASC' } }),
      this.auditFindingsRepo.find({ order: { year: 'DESC', order: 'ASC' } }),
    ]);
    return {
      covenants: covenants.map((c) => ({
        covenant_text: c.covenant_text,
        type: c.type,
        status: c.status,
        comments: c.comments,
      })),
      safeguards: safeguards.map((s) => ({
        type: s.type,
        measure_name: s.measure_name,
        total_count: s.total_count,
        not_started_count: s.not_started_count,
        ongoing_count: s.ongoing_count,
        completed_count: s.completed_count,
        budget_allocated_ua: s.budget_allocated_ua,
        amount_disbursed_ua: s.amount_disbursed_ua,
        progress_pct:
          s.total_count > 0
            ? Math.round((s.completed_count / s.total_count) * 100)
            : 0,
      })),
      audit_findings: findings.map((f) => ({
        year: f.year,
        audit_status: f.audit_status,
        key_issue: f.key_issue,
        corrective_measures: f.corrective_measures,
        comments: f.comments,
        expected_submission_date: f.expected_submission_date
          ? new Date(f.expected_submission_date).toISOString().slice(0, 10)
          : null,
      })),
    };
  }

  /**
   * Annex 1 — Output-projection matrix. Per output indicator, returns
   * a year-by-year row of {original, updated, actual}. Originals come
   * from indicator_year_targets where is_original=true; updated from
   * is_original=false; actuals are the latest progress entry per
   * calendar year.
   */
  private async buildAnnex1(): Promise<QprAnnex1Row[]> {
    const indicators = await this.indicatorRepo.find({
      where: [{ kind: 'output' }, { level: 'output' }],
      order: { code: 'ASC' },
    });
    if (indicators.length === 0) return [];
    const indIds = indicators.map((i) => i.id);
    const yearTargetRows = await this.yearTargetsRepo.find({
      where: { indicator_id: In(indIds) },
    });
    const progressRows = await this.progressRepo.find({
      where: { indicator_id: In(indIds) },
      order: { date: 'ASC' },
    });
    return indicators.map((ind) =>
      this.toAnnex1Row(ind, yearTargetRows, progressRows),
    );
  }

  private toAnnex1Row(
    ind: Indicator,
    yearTargetRows: IndicatorYearTarget[],
    progressRows: IndicatorProgress[],
  ): QprAnnex1Row {
    const myTargets = yearTargetRows.filter((y) => y.indicator_id === ind.id);
    const myProgress = progressRows.filter((p) => p.indicator_id === ind.id);
    const yearsSet = new Set<number>();
    for (const t of myTargets) yearsSet.add(t.year);
    for (const p of myProgress) {
      yearsSet.add(new Date(p.date).getUTCFullYear());
    }
    const years = Array.from(yearsSet).sort((a, b) => a - b);
    const yearRows = years.map((y) => {
      const original = myTargets.find((t) => t.year === y && t.is_original);
      const updated = myTargets.find((t) => t.year === y && !t.is_original);
      // Actual = latest progress entry in this calendar year.
      let actual: number | null = null;
      for (const p of myProgress) {
        if (new Date(p.date).getUTCFullYear() === y) {
          actual = Number(p.value);
        }
      }
      return {
        year: y,
        original: original ? Number(original.target_value) : null,
        updated: updated ? Number(updated.target_value) : null,
        actual,
      };
    });
    return {
      output_code: ind.code,
      output_name: ind.name,
      baseline: Number(ind.baseline),
      years: yearRows,
    };
  }

  private async loadSupervisionCover(): Promise<SupervisionCover | null> {
    try {
      const meta = await this.projectMetaService.get();
      return {
        name: meta.name,
        sap_code: meta.sap_code,
        pdo_text: meta.pdo_text,
        baseline_year: meta.baseline_year,
        completion_year: meta.completion_year,
        midpoint_date: meta.midpoint_date
          ? new Date(meta.midpoint_date).toISOString().slice(0, 10)
          : null,
      };
    } catch (e) {
      if (e instanceof NotFoundException) return null;
      throw e;
    }
  }

  private async buildComponentRows(): Promise<ComponentReportRow[]> {
    const allNodes = await this.nodeRepo.find({ order: { order: 'ASC' } });
    const components = allNodes.filter((n) => n.type === 'component');
    if (components.length === 0) return [];

    const childrenByParent = new Map<string, LogframeNode[]>();
    for (const n of allNodes) {
      if (!n.parent_id) continue;
      const list = childrenByParent.get(n.parent_id) ?? [];
      list.push(n);
      childrenByParent.set(n.parent_id, list);
    }

    const indicators = await this.indicatorRepo.find();
    const indByNode = new Map<string, Indicator[]>();
    for (const ind of indicators) {
      if (!ind.logframe_level_id) continue;
      const list = indByNode.get(ind.logframe_level_id) ?? [];
      list.push(ind);
      indByNode.set(ind.logframe_level_id, list);
    }

    return components.map((c) =>
      this.toComponentRow(c, childrenByParent, indByNode),
    );
  }

  private toComponentRow(
    component: LogframeNode,
    childrenByParent: Map<string, LogframeNode[]>,
    indByNode: Map<string, Indicator[]>,
  ): ComponentReportRow {
    const descendantIds = this.collectDescendantIds(
      component.id,
      childrenByParent,
    );
    const descendantIndicators: Indicator[] = [];
    for (const id of [component.id, ...descendantIds]) {
      const list = indByNode.get(id);
      if (list) descendantIndicators.push(...list);
    }

    let onTrack = 0;
    let atRisk = 0;
    let offTrack = 0;
    let progressSum = 0;
    let progressDenom = 0;
    for (const ind of descendantIndicators) {
      if (ind.status === 'on_track') onTrack += 1;
      else if (ind.status === 'at_risk') atRisk += 1;
      else offTrack += 1;
      const target = Number(ind.target);
      if (target > 0) {
        progressSum += Math.min(1, Number(ind.current_value) / target);
        progressDenom += 1;
      }
    }

    const outputStatementCodes = (childrenByParent.get(component.id) ?? [])
      .filter(
        (n) =>
          n.type === 'output_statement' || n.type === 'output' /* legacy */,
      )
      .map((n) => n.code);

    return {
      id: component.id,
      code: component.code,
      title: component.title,
      budget_usd:
        component.budget_usd === null ? null : Number(component.budget_usd),
      budget_currency: component.budget_currency,
      indicator_count: descendantIndicators.length,
      on_track: onTrack,
      at_risk: atRisk,
      off_track: offTrack,
      progress_pct:
        progressDenom > 0 ? Math.round((progressSum / progressDenom) * 100) : 0,
      output_statement_codes: outputStatementCodes,
    };
  }

  private collectDescendantIds(
    rootId: string,
    childrenByParent: Map<string, LogframeNode[]>,
  ): string[] {
    const result: string[] = [];
    const stack: string[] = [rootId];
    while (stack.length > 0) {
      const id = stack.pop()!;
      const kids = childrenByParent.get(id) ?? [];
      for (const k of kids) {
        result.push(k.id);
        stack.push(k.id);
      }
    }
    return result;
  }

  private async loadDisaggregationByIndicator(): Promise<
    Record<string, DisaggregationRollupRow[]>
  > {
    const indicators = await this.indicatorRepo.find();
    const out: Record<string, DisaggregationRollupRow[]> = {};
    for (const ind of indicators) {
      const rules = await this.disaggregationService.getRules(ind.id);
      if (rules.length === 0) continue;
      const rollups: DisaggregationRollupRow[] = [];
      for (const rule of rules) {
        const rollup = await this.disaggregationService.getRollup(
          ind.id,
          rule.axis as DisaggregationAxis,
        );
        rollups.push({
          axis: rollup.axis,
          total: rollup.total,
          buckets: rollup.buckets,
          target: rollup.target,
          gap: rollup.gap,
        });
      }
      out[ind.id] = rollups;
    }
    return out;
  }

  // ─── Private helpers ───────────────────────────────────────────────────────

  private async loadYearTargetsMap(): Promise<
    Map<string, IndicatorYearTarget[]>
  > {
    const rows = await this.yearTargetsRepo.find({ order: { year: 'ASC' } });
    const map = new Map<string, IndicatorYearTarget[]>();
    for (const yt of rows) {
      if (!map.has(yt.indicator_id)) map.set(yt.indicator_id, []);
      map.get(yt.indicator_id)!.push(yt);
    }
    return map;
  }

  private async resolveProjectAnchors(): Promise<ProjectAnchors> {
    try {
      const meta = await this.projectMetaService.get();
      return {
        baselineDate: new Date(Date.UTC(meta.baseline_year, 0, 1)),
        // End of completion year, 23:59:59.999 UTC. Pre-Phase-3 status math
        // treats "completion" as Dec 31 of completion_year.
        completionDate: new Date(
          Date.UTC(meta.completion_year, 11, 31, 23, 59, 59, 999),
        ),
      };
    } catch (e) {
      if (!(e instanceof NotFoundException)) throw e;
      return {};
    }
  }

  private async loadProgressMap(
    dateFrom?: string,
    dateTo?: string,
  ): Promise<Map<string, { date: string; value: number }[]>> {
    const qb = this.progressRepo
      .createQueryBuilder('p')
      .orderBy('p.date', 'ASC');
    if (dateFrom) qb.andWhere('p.date >= :dateFrom', { dateFrom });
    if (dateTo) qb.andWhere('p.date <= :dateTo', { dateTo });
    const rows = await qb.getMany();

    const map = new Map<string, { date: string; value: number }[]>();
    for (const p of rows) {
      if (!map.has(p.indicator_id)) map.set(p.indicator_id, []);
      map
        .get(p.indicator_id)!
        .push({ date: p.date.toISOString(), value: Number(p.value) });
    }
    return map;
  }

  private async loadSubsByIndicatorMap(
    dateFrom?: string,
    dateTo?: string,
  ): Promise<Map<string, SubCounts>> {
    type Row = {
      indicator_id: string;
      validation_status: string;
      count: string;
    };
    const rows: Row[] = await this.indicatorRepo.manager.query(
      `SELECT
         unnest(f.indicator_ids::uuid[]) AS indicator_id,
         s.validation_status,
         COUNT(*)::int AS count
       FROM submissions s
       INNER JOIN forms f ON f.id = s.form_id
       WHERE ($1::timestamptz IS NULL OR s.submitted_at >= $1)
         AND ($2::timestamptz IS NULL OR s.submitted_at <= $2)
       GROUP BY unnest(f.indicator_ids::uuid[]), s.validation_status`,
      [dateFrom ?? null, dateTo ?? null],
    );

    const map = new Map<string, SubCounts>();
    for (const row of rows) {
      if (!map.has(row.indicator_id)) {
        map.set(row.indicator_id, {
          total: 0,
          approved: 0,
          rejected: 0,
          pending: 0,
        });
      }
      const entry = map.get(row.indicator_id)!;
      const count = Number(row.count);
      entry.total += count;
      if (row.validation_status === 'approved') entry.approved += count;
      else if (row.validation_status === 'rejected') entry.rejected += count;
      else entry.pending += count;
    }
    return map;
  }

  /**
   * Map of indicator_id → evidence rows that should appear on that
   * indicator's report row. Per the dependency-map decision:
   *
   *  - indicator-attached docs land on that indicator.
   *  - progress-attached docs roll up to the indicator the progress
   *    belongs to (via a join through indicator_progress).
   *  - location-attached docs are intentionally excluded here — they
   *    don't have a 1:1 mapping to indicators.
   */
  private async loadEvidenceByIndicatorMap(): Promise<
    Map<string, EvidenceRow[]>
  > {
    const rows = await this.evidenceRepo
      .createQueryBuilder('d')
      .leftJoin('indicator_progress', 'p', 'p.id = d.indicator_progress_id')
      .select([
        'd.id           AS id',
        'd.title        AS title',
        'd.document_type AS document_type',
        'd.file_url     AS file_url',
        'COALESCE(d.indicator_id, p.indicator_id) AS indicator_id',
      ])
      .where('d.deleted_at IS NULL')
      .andWhere(
        '(d.indicator_id IS NOT NULL OR d.indicator_progress_id IS NOT NULL)',
      )
      .orderBy('d.uploaded_at', 'DESC')
      .getRawMany<{
        id: string;
        title: string;
        document_type: DocumentType;
        file_url: string;
        indicator_id: string | null;
      }>();

    const map = new Map<string, EvidenceRow[]>();
    for (const row of rows) {
      if (!row.indicator_id) continue;
      if (!map.has(row.indicator_id)) map.set(row.indicator_id, []);
      map.get(row.indicator_id)!.push({
        id: row.id,
        title: row.title,
        document_type: row.document_type,
        file_url: row.file_url,
      });
    }
    return map;
  }

  private async loadGlobalSubStats(dateFrom?: string, dateTo?: string) {
    type Row = {
      total: string;
      approved: string;
      rejected: string;
      pending: string;
      off_site: string;
    };
    const [row]: Row[] = await this.indicatorRepo.manager.query(
      `SELECT
         COUNT(*)::int                                              AS total,
         COUNT(*) FILTER (WHERE validation_status = 'approved')::int AS approved,
         COUNT(*) FILTER (WHERE validation_status = 'rejected')::int AS rejected,
         COUNT(*) FILTER (WHERE validation_status = 'pending')::int  AS pending,
         COUNT(*) FILTER (WHERE on_site = false)::int               AS off_site
       FROM submissions
       WHERE ($1::timestamptz IS NULL OR submitted_at >= $1)
         AND ($2::timestamptz IS NULL OR submitted_at <= $2)`,
      [dateFrom ?? null, dateTo ?? null],
    );
    return {
      totalSubs: Number(row.total),
      approvedSubs: Number(row.approved),
      rejectedSubs: Number(row.rejected),
      pendingSubs: Number(row.pending),
      offSiteSubs: Number(row.off_site),
    };
  }

  private toIndicatorRow(
    ind: Indicator,
    progressByIndicator: Map<string, { date: string; value: number }[]>,
    subsByIndicator: Map<string, SubCounts>,
    yearTargetsByIndicator: Map<string, IndicatorYearTarget[]>,
    evidenceByIndicator: Map<string, EvidenceRow[]>,
    anchors: ProjectAnchors,
  ): IndicatorReportRow {
    const target = Number(ind.target);
    const current = Number(ind.current_value);
    const yts = yearTargetsByIndicator.get(ind.id) ?? [];

    const helperIndicator = {
      target_mode: ind.target_mode,
      target,
      baseline: Number(ind.baseline),
    };
    const helperYearTargets = yts.map((y) => ({
      year: y.year,
      target_value: Number(y.target_value),
    }));
    const expected_at_now = expectedAt(
      helperIndicator,
      helperYearTargets,
      new Date(),
      { baselineDate: anchors.baselineDate },
    );
    const expected_at_completion = anchors.completionDate
      ? expectedAt(helperIndicator, helperYearTargets, anchors.completionDate, {
          baselineDate: anchors.baselineDate,
        })
      : null;

    return {
      id: ind.id,
      code: ind.code,
      name: ind.name,
      unit: ind.unit,
      baseline: Number(ind.baseline),
      target,
      current_value: current,
      progress_pct: target > 0 ? Math.round((current / target) * 100) : 0,
      status: ind.status,
      responsible_party: ind.responsible_party,
      means_of_verification: ind.means_of_verification,
      frequency: ind.frequency,
      trend: progressByIndicator.get(ind.id) ?? [],
      submissions: subsByIndicator.get(ind.id) ?? {
        total: 0,
        approved: 0,
        rejected: 0,
        pending: 0,
      },
      year_targets: yts.map((y) => ({
        year: y.year,
        target_value: Number(y.target_value),
        notes: y.notes,
      })),
      expected_at_now,
      expected_at_completion,
      evidence: evidenceByIndicator.get(ind.id) ?? [],
    };
  }

  private buildLogframeRows(
    nodes: LogframeNode[],
    indicators: Indicator[],
    progressByIndicator: Map<string, { date: string; value: number }[]>,
    subsByIndicator: Map<string, SubCounts>,
    yearTargetsByIndicator: Map<string, IndicatorYearTarget[]>,
    evidenceByIndicator: Map<string, EvidenceRow[]>,
    anchors: ProjectAnchors,
  ): LogframeReportRow[] {
    const { byNode, unassigned } = this.groupIndicatorsByNode(indicators);
    const { childrenMap, roots } = this.buildChildrenMap(nodes);
    const toRow = (ind: Indicator) =>
      this.toIndicatorRow(
        ind,
        progressByIndicator,
        subsByIndicator,
        yearTargetsByIndicator,
        evidenceByIndicator,
        anchors,
      );

    const rows: LogframeReportRow[] = [];
    // Iterative DFS — avoids recursive closure which inflates cognitive complexity
    const stack = roots
      .toSorted((a, b) => a.order - b.order)
      .map((n) => ({ node: n, depth: 0 }))
      .reverse();

    while (stack.length > 0) {
      const { node, depth } = stack.pop()!;
      rows.push({
        depth,
        type: node.type,
        code: node.code,
        title: node.title,
        indicators: (byNode.get(node.id) ?? []).map(toRow),
      });
      const children = (childrenMap.get(node.id) ?? []).sort(
        (a, b) => a.order - b.order,
      );
      for (let i = children.length - 1; i >= 0; i--) {
        stack.push({ node: children[i], depth: depth + 1 });
      }
    }

    if (unassigned.length > 0) {
      rows.push({
        depth: 0,
        type: 'unassigned',
        code: '—',
        title: 'Unassigned Indicators',
        indicators: unassigned.map(toRow),
      });
    }

    return rows;
  }

  private groupIndicatorsByNode(indicators: Indicator[]): {
    byNode: Map<string, Indicator[]>;
    unassigned: Indicator[];
  } {
    const byNode = new Map<string, Indicator[]>();
    const unassigned: Indicator[] = [];
    for (const ind of indicators) {
      if (ind.logframe_level_id) {
        if (!byNode.has(ind.logframe_level_id))
          byNode.set(ind.logframe_level_id, []);
        byNode.get(ind.logframe_level_id)!.push(ind);
      } else {
        unassigned.push(ind);
      }
    }
    return { byNode, unassigned };
  }

  private buildChildrenMap(nodes: LogframeNode[]): {
    childrenMap: Map<string, LogframeNode[]>;
    roots: LogframeNode[];
  } {
    const childrenMap = new Map<string, LogframeNode[]>();
    const roots: LogframeNode[] = [];
    for (const node of nodes) {
      if (node.parent_id) {
        if (!childrenMap.has(node.parent_id))
          childrenMap.set(node.parent_id, []);
        childrenMap.get(node.parent_id)!.push(node);
      } else {
        roots.push(node);
      }
    }
    return { childrenMap, roots };
  }
}
