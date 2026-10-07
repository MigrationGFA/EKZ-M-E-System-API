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
import { DisaggregationService } from '../indicators/disaggregation.service.js';
import { AzureStorageService } from '../storage/azure-storage.service.js';
import { ProjectFinancingSource } from '../project-financing-sources/project-financing-source.entity.js';
import { ProjectRisk } from '../project-risks/project-risk.entity.js';
import { ProjectCovenant } from '../compliance/covenants/project-covenant.entity.js';
import { SafeguardMeasure } from '../compliance/safeguards/safeguard-measure.entity.js';
import { AuditFinding } from '../compliance/audit-findings/audit-finding.entity.js';
import { ActivityQuarterlyStatus } from '../awp-status/activity-quarterly-status.entity.js';
import { QuarterlyReportsService } from '../quarterly-reports/quarterly-reports.service.js';
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
    trend: {
        date: string;
        value: number;
    }[];
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
    unanticipated_results: {
        category: string;
        text: string;
    }[];
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
    period: {
        year: number;
        quarter: number;
    };
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
export declare class ReportsService {
    private readonly reportRepo;
    private readonly indicatorRepo;
    private readonly progressRepo;
    private readonly yearTargetsRepo;
    private readonly subRepo;
    private readonly nodeRepo;
    private readonly evidenceRepo;
    private readonly mailService;
    private readonly auditService;
    private readonly projectMetaService;
    private readonly disaggregationService;
    private readonly azureStorage;
    private readonly financingRepo;
    private readonly risksRepo;
    private readonly covenantsRepo;
    private readonly safeguardsRepo;
    private readonly auditFindingsRepo;
    private readonly awpRepo;
    private readonly quarterlyReportsService;
    constructor(reportRepo: Repository<Report>, indicatorRepo: Repository<Indicator>, progressRepo: Repository<IndicatorProgress>, yearTargetsRepo: Repository<IndicatorYearTarget>, subRepo: Repository<Submission>, nodeRepo: Repository<LogframeNode>, evidenceRepo: Repository<EvidenceDocument>, mailService: MailService, auditService: AuditService, projectMetaService: ProjectMetaService, disaggregationService: DisaggregationService, azureStorage: AzureStorageService, financingRepo: Repository<ProjectFinancingSource>, risksRepo: Repository<ProjectRisk>, covenantsRepo: Repository<ProjectCovenant>, safeguardsRepo: Repository<SafeguardMeasure>, auditFindingsRepo: Repository<AuditFinding>, awpRepo: Repository<ActivityQuarterlyStatus>, quarterlyReportsService: QuarterlyReportsService);
    findAll(): Promise<{
        id: string;
        title: string;
        generatedBy: string;
        generatedAt: Date;
        format: string;
        filters: Record<string, any>;
        downloadUrl: string;
    }[]>;
    generate(title: string, format: string, generatedBy: string, filters: Record<string, any>, generatorEmail: string, actorId: string): Promise<{
        report_id: string;
        download_url: string;
        format: string;
    }>;
    getPreviewData(generatedBy: string, dateFrom?: string, dateTo?: string): Promise<ReportPreviewData>;
    getSupervisionData(generatedBy: string, dateFrom?: string, dateTo?: string): Promise<SupervisionData>;
    getQprData(year: number, quarter: number, generatedBy: string, actorId: string, actorName: string): Promise<QprData>;
    private loadQprCover;
    private loadActiveRisks;
    private loadNarratives;
    private loadAwpStatus;
    private loadCompliance;
    private buildAnnex1;
    private toAnnex1Row;
    private loadSupervisionCover;
    private buildComponentRows;
    private toComponentRow;
    private collectDescendantIds;
    private loadDisaggregationByIndicator;
    private loadYearTargetsMap;
    private resolveProjectAnchors;
    private loadProgressMap;
    private loadSubsByIndicatorMap;
    private loadEvidenceByIndicatorMap;
    private loadGlobalSubStats;
    private toIndicatorRow;
    private buildLogframeRows;
    private groupIndicatorsByNode;
    private buildChildrenMap;
}
export {};
