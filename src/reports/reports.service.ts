import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
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
import { renderAfdbSupervisionPdf } from './templates/afdb-supervision.js';

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

    // Phase 9: server-side PDF generation. Excel stays client-side — this
    // endpoint only records metadata for non-PDF formats and the client is
    // responsible for the XLSX download. Closes AUDIT_FINDINGS §4.4 for
    // the PDF path.
    let downloadUrl = '#';
    if (format === 'pdf') {
      const data = await this.getSupervisionData(
        generatedBy,
        typeof filters.date_from === 'string' ? filters.date_from : undefined,
        typeof filters.date_to === 'string' ? filters.date_to : undefined,
      );
      const buffer = await renderAfdbSupervisionPdf(data);
      const key = `${REPORTS_KEY_PREFIX}/${saved.id}.pdf`;
      downloadUrl = await this.azureStorage.uploadDocument(
        REPORTS_CONTAINER,
        key,
        buffer,
        'application/pdf',
      );
      saved.download_url = downloadUrl;
      await this.reportRepo.save(saved);
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
