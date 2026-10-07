"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReportsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const report_entity_js_1 = require("./report.entity.js");
const indicator_entity_js_1 = require("../indicators/indicator.entity.js");
const indicator_progress_entity_js_1 = require("../indicators/indicator-progress.entity.js");
const indicator_year_target_entity_js_1 = require("../indicators/indicator-year-target.entity.js");
const submission_entity_js_1 = require("../submissions/submission.entity.js");
const logframe_node_entity_js_1 = require("../logframe/logframe-node.entity.js");
const evidence_document_entity_js_1 = require("../evidence/evidence-document.entity.js");
const mail_service_js_1 = require("../mail/mail.service.js");
const audit_service_js_1 = require("../audit/audit.service.js");
const project_meta_service_js_1 = require("../project-meta/project-meta.service.js");
const expected_progress_js_1 = require("../indicators/helpers/expected-progress.js");
const disaggregation_service_js_1 = require("../indicators/disaggregation.service.js");
const azure_storage_service_js_1 = require("../storage/azure-storage.service.js");
const afdb_qpr_js_1 = require("./templates/afdb-qpr.js");
const project_financing_source_entity_js_1 = require("../project-financing-sources/project-financing-source.entity.js");
const project_risk_entity_js_1 = require("../project-risks/project-risk.entity.js");
const project_covenant_entity_js_1 = require("../compliance/covenants/project-covenant.entity.js");
const safeguard_measure_entity_js_1 = require("../compliance/safeguards/safeguard-measure.entity.js");
const audit_finding_entity_js_1 = require("../compliance/audit-findings/audit-finding.entity.js");
const activity_quarterly_status_entity_js_1 = require("../awp-status/activity-quarterly-status.entity.js");
const quarterly_reports_service_js_1 = require("../quarterly-reports/quarterly-reports.service.js");
const REPORTS_CONTAINER = 'wiftdocuments';
const REPORTS_KEY_PREFIX = 'reports';
let ReportsService = class ReportsService {
    reportRepo;
    indicatorRepo;
    progressRepo;
    yearTargetsRepo;
    subRepo;
    nodeRepo;
    evidenceRepo;
    mailService;
    auditService;
    projectMetaService;
    disaggregationService;
    azureStorage;
    financingRepo;
    risksRepo;
    covenantsRepo;
    safeguardsRepo;
    auditFindingsRepo;
    awpRepo;
    quarterlyReportsService;
    constructor(reportRepo, indicatorRepo, progressRepo, yearTargetsRepo, subRepo, nodeRepo, evidenceRepo, mailService, auditService, projectMetaService, disaggregationService, azureStorage, financingRepo, risksRepo, covenantsRepo, safeguardsRepo, auditFindingsRepo, awpRepo, quarterlyReportsService) {
        this.reportRepo = reportRepo;
        this.indicatorRepo = indicatorRepo;
        this.progressRepo = progressRepo;
        this.yearTargetsRepo = yearTargetsRepo;
        this.subRepo = subRepo;
        this.nodeRepo = nodeRepo;
        this.evidenceRepo = evidenceRepo;
        this.mailService = mailService;
        this.auditService = auditService;
        this.projectMetaService = projectMetaService;
        this.disaggregationService = disaggregationService;
        this.azureStorage = azureStorage;
        this.financingRepo = financingRepo;
        this.risksRepo = risksRepo;
        this.covenantsRepo = covenantsRepo;
        this.safeguardsRepo = safeguardsRepo;
        this.auditFindingsRepo = auditFindingsRepo;
        this.awpRepo = awpRepo;
        this.quarterlyReportsService = quarterlyReportsService;
    }
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
    async generate(title, format, generatedBy, filters, generatorEmail, actorId) {
        const report = this.reportRepo.create({
            title,
            format,
            generated_by: generatedBy,
            generated_at: new Date(),
            filters,
            download_url: '#',
        });
        const saved = await this.reportRepo.save(report);
        let downloadUrl = '#';
        if (format === 'pdf') {
            const now = new Date();
            const year = typeof filters.year === 'number' ? filters.year : now.getUTCFullYear();
            const quarter = typeof filters.quarter === 'number'
                ? filters.quarter
                : Math.floor(now.getUTCMonth() / 3) + 1;
            const data = await this.getQprData(year, quarter, generatedBy, actorId, generatorEmail);
            const buffer = await (0, afdb_qpr_js_1.renderAfdbQprPdf)(data);
            const key = `${REPORTS_KEY_PREFIX}/${saved.id}.pdf`;
            downloadUrl = await this.azureStorage.uploadDocument(REPORTS_CONTAINER, key, buffer, 'application/pdf');
            saved.download_url = downloadUrl;
            await this.reportRepo.save(saved);
            await this.quarterlyReportsService.markGenerated(year, quarter, generatedBy);
        }
        void this.auditService.log({
            user_id: actorId,
            user_name: generatorEmail,
            action: 'create',
            resource: 'report',
            resource_id: saved.id,
            after_data: { title, format, filters, generated_by: generatedBy },
        });
        void this.mailService.sendReportReady(generatorEmail, generatedBy, title, format);
        return {
            report_id: saved.id,
            download_url: downloadUrl,
            format: saved.format,
        };
    }
    async getPreviewData(generatedBy, dateFrom, dateTo) {
        const [indicators, nodes, yearTargetsByIndicator, anchors] = await Promise.all([
            this.indicatorRepo.find(),
            this.nodeRepo.find({ order: { order: 'ASC' } }),
            this.loadYearTargetsMap(),
            this.resolveProjectAnchors(),
        ]);
        const progressByIndicator = await this.loadProgressMap(dateFrom, dateTo);
        const subsByIndicator = await this.loadSubsByIndicatorMap(dateFrom, dateTo);
        const globalStats = await this.loadGlobalSubStats(dateFrom, dateTo);
        const evidenceByIndicator = await this.loadEvidenceByIndicatorMap();
        const { totalSubs, approvedSubs, rejectedSubs, pendingSubs, offSiteSubs } = globalStats;
        const verifiedPct = totalSubs > 0 ? Math.round((approvedSubs / totalSubs) * 100) : 0;
        let onTrack = 0;
        let atRisk = 0;
        let offTrack = 0;
        for (const ind of indicators) {
            if (ind.status === 'on_track')
                onTrack++;
            else if (ind.status === 'at_risk')
                atRisk++;
            else
                offTrack++;
        }
        const logframe_rows = this.buildLogframeRows(nodes, indicators, progressByIndicator, subsByIndicator, yearTargetsByIndicator, evidenceByIndicator, anchors);
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
                on_track_pct: indicators.length > 0
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
    async getSupervisionData(generatedBy, dateFrom, dateTo) {
        const preview = await this.getPreviewData(generatedBy, dateFrom, dateTo);
        const cover = await this.loadSupervisionCover();
        const components = await this.buildComponentRows();
        const disaggregation_by_indicator = await this.loadDisaggregationByIndicator();
        return {
            ...preview,
            cover,
            components,
            disaggregation_by_indicator,
        };
    }
    async getQprData(year, quarter, generatedBy, actorId, actorName) {
        const supervision = await this.getSupervisionData(generatedBy);
        const cover = await this.loadQprCover();
        const risks = await this.loadActiveRisks();
        const narratives = await this.loadNarratives(year, quarter, actorId, actorName);
        const { current: awp_current_qtr, next: awp_next_qtr } = await this.loadAwpStatus(year, quarter);
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
    async loadQprCover() {
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
                    disbursed_pct: s.total_approved_ua > 0
                        ? Math.round((s.disbursed_ua / s.total_approved_ua) * 100)
                        : 0,
                })),
            };
        }
        catch (e) {
            if (e instanceof common_1.NotFoundException)
                return null;
            throw e;
        }
    }
    async loadActiveRisks() {
        const rows = await this.risksRepo.find({
            where: { resolved_at: (0, typeorm_2.IsNull)() },
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
    async loadNarratives(year, quarter, actorId, actorName) {
        const row = await this.quarterlyReportsService.getOrCreate(year, quarter, actorId, actorName);
        return {
            executive_summary: row.executive_summary,
            pdo_assessment: row.pdo_assessment,
            unanticipated_results: row.unanticipated_results ?? [],
            bank_performance_assessment: row.bank_performance_assessment,
            borrower_performance_assessment: row.borrower_performance_assessment,
            cofinancier_performance_assessment: row.cofinancier_performance_assessment,
            pmt_status: row.pmt_status,
            awp_planned_next_qtr: row.awp_planned_next_qtr,
        };
    }
    async loadAwpStatus(year, quarter) {
        const rows = await this.awpRepo.find({
            where: { year, quarter },
            order: { created_at: 'ASC' },
        });
        if (rows.length === 0)
            return { current: [], next: [] };
        const nodeIds = Array.from(new Set(rows.map((r) => r.logframe_node_id)));
        const nodes = await this.nodeRepo.find({ where: { id: (0, typeorm_2.In)(nodeIds) } });
        const nodeMap = new Map(nodes.map((n) => [n.id, n]));
        const allNodes = await this.nodeRepo.find();
        const allMap = new Map(allNodes.map((n) => [n.id, n]));
        const componentCodeFor = (id) => {
            let cursor = allMap.get(id) ?? null;
            let depth = 0;
            while (cursor && depth < 10) {
                if (cursor.type === 'component')
                    return cursor.code;
                cursor = cursor.parent_id
                    ? (allMap.get(cursor.parent_id) ?? null)
                    : null;
                depth += 1;
            }
            return null;
        };
        const toRow = (r) => {
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
    async loadCompliance() {
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
                progress_pct: s.total_count > 0
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
    async buildAnnex1() {
        const indicators = await this.indicatorRepo.find({
            where: [{ kind: 'output' }, { level: 'output' }],
            order: { code: 'ASC' },
        });
        if (indicators.length === 0)
            return [];
        const indIds = indicators.map((i) => i.id);
        const yearTargetRows = await this.yearTargetsRepo.find({
            where: { indicator_id: (0, typeorm_2.In)(indIds) },
        });
        const progressRows = await this.progressRepo.find({
            where: { indicator_id: (0, typeorm_2.In)(indIds) },
            order: { date: 'ASC' },
        });
        return indicators.map((ind) => this.toAnnex1Row(ind, yearTargetRows, progressRows));
    }
    toAnnex1Row(ind, yearTargetRows, progressRows) {
        const myTargets = yearTargetRows.filter((y) => y.indicator_id === ind.id);
        const myProgress = progressRows.filter((p) => p.indicator_id === ind.id);
        const yearsSet = new Set();
        for (const t of myTargets)
            yearsSet.add(t.year);
        for (const p of myProgress) {
            yearsSet.add(new Date(p.date).getUTCFullYear());
        }
        const years = Array.from(yearsSet).sort((a, b) => a - b);
        const yearRows = years.map((y) => {
            const original = myTargets.find((t) => t.year === y && t.is_original);
            const updated = myTargets.find((t) => t.year === y && !t.is_original);
            let actual = null;
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
    async loadSupervisionCover() {
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
        }
        catch (e) {
            if (e instanceof common_1.NotFoundException)
                return null;
            throw e;
        }
    }
    async buildComponentRows() {
        const allNodes = await this.nodeRepo.find({ order: { order: 'ASC' } });
        const components = allNodes.filter((n) => n.type === 'component');
        if (components.length === 0)
            return [];
        const childrenByParent = new Map();
        for (const n of allNodes) {
            if (!n.parent_id)
                continue;
            const list = childrenByParent.get(n.parent_id) ?? [];
            list.push(n);
            childrenByParent.set(n.parent_id, list);
        }
        const indicators = await this.indicatorRepo.find();
        const indByNode = new Map();
        for (const ind of indicators) {
            if (!ind.logframe_level_id)
                continue;
            const list = indByNode.get(ind.logframe_level_id) ?? [];
            list.push(ind);
            indByNode.set(ind.logframe_level_id, list);
        }
        return components.map((c) => this.toComponentRow(c, childrenByParent, indByNode));
    }
    toComponentRow(component, childrenByParent, indByNode) {
        const descendantIds = this.collectDescendantIds(component.id, childrenByParent);
        const descendantIndicators = [];
        for (const id of [component.id, ...descendantIds]) {
            const list = indByNode.get(id);
            if (list)
                descendantIndicators.push(...list);
        }
        let onTrack = 0;
        let atRisk = 0;
        let offTrack = 0;
        let progressSum = 0;
        let progressDenom = 0;
        for (const ind of descendantIndicators) {
            if (ind.status === 'on_track')
                onTrack += 1;
            else if (ind.status === 'at_risk')
                atRisk += 1;
            else
                offTrack += 1;
            const target = Number(ind.target);
            if (target > 0) {
                progressSum += Math.min(1, Number(ind.current_value) / target);
                progressDenom += 1;
            }
        }
        const outputStatementCodes = (childrenByParent.get(component.id) ?? [])
            .filter((n) => n.type === 'output_statement' || n.type === 'output')
            .map((n) => n.code);
        return {
            id: component.id,
            code: component.code,
            title: component.title,
            budget_usd: component.budget_usd === null ? null : Number(component.budget_usd),
            budget_currency: component.budget_currency,
            indicator_count: descendantIndicators.length,
            on_track: onTrack,
            at_risk: atRisk,
            off_track: offTrack,
            progress_pct: progressDenom > 0 ? Math.round((progressSum / progressDenom) * 100) : 0,
            output_statement_codes: outputStatementCodes,
        };
    }
    collectDescendantIds(rootId, childrenByParent) {
        const result = [];
        const stack = [rootId];
        while (stack.length > 0) {
            const id = stack.pop();
            const kids = childrenByParent.get(id) ?? [];
            for (const k of kids) {
                result.push(k.id);
                stack.push(k.id);
            }
        }
        return result;
    }
    async loadDisaggregationByIndicator() {
        const indicators = await this.indicatorRepo.find();
        const out = {};
        for (const ind of indicators) {
            const rules = await this.disaggregationService.getRules(ind.id);
            if (rules.length === 0)
                continue;
            const rollups = [];
            for (const rule of rules) {
                const rollup = await this.disaggregationService.getRollup(ind.id, rule.axis);
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
    async loadYearTargetsMap() {
        const rows = await this.yearTargetsRepo.find({ order: { year: 'ASC' } });
        const map = new Map();
        for (const yt of rows) {
            if (!map.has(yt.indicator_id))
                map.set(yt.indicator_id, []);
            map.get(yt.indicator_id).push(yt);
        }
        return map;
    }
    async resolveProjectAnchors() {
        try {
            const meta = await this.projectMetaService.get();
            return {
                baselineDate: new Date(Date.UTC(meta.baseline_year, 0, 1)),
                completionDate: new Date(Date.UTC(meta.completion_year, 11, 31, 23, 59, 59, 999)),
            };
        }
        catch (e) {
            if (!(e instanceof common_1.NotFoundException))
                throw e;
            return {};
        }
    }
    async loadProgressMap(dateFrom, dateTo) {
        const qb = this.progressRepo
            .createQueryBuilder('p')
            .orderBy('p.date', 'ASC');
        if (dateFrom)
            qb.andWhere('p.date >= :dateFrom', { dateFrom });
        if (dateTo)
            qb.andWhere('p.date <= :dateTo', { dateTo });
        const rows = await qb.getMany();
        const map = new Map();
        for (const p of rows) {
            if (!map.has(p.indicator_id))
                map.set(p.indicator_id, []);
            map
                .get(p.indicator_id)
                .push({ date: p.date.toISOString(), value: Number(p.value) });
        }
        return map;
    }
    async loadSubsByIndicatorMap(dateFrom, dateTo) {
        const rows = await this.indicatorRepo.manager.query(`SELECT
         unnest(f.indicator_ids::uuid[]) AS indicator_id,
         s.validation_status,
         COUNT(*)::int AS count
       FROM submissions s
       INNER JOIN forms f ON f.id = s.form_id
       WHERE ($1::timestamptz IS NULL OR s.submitted_at >= $1)
         AND ($2::timestamptz IS NULL OR s.submitted_at <= $2)
       GROUP BY unnest(f.indicator_ids::uuid[]), s.validation_status`, [dateFrom ?? null, dateTo ?? null]);
        const map = new Map();
        for (const row of rows) {
            if (!map.has(row.indicator_id)) {
                map.set(row.indicator_id, {
                    total: 0,
                    approved: 0,
                    rejected: 0,
                    pending: 0,
                });
            }
            const entry = map.get(row.indicator_id);
            const count = Number(row.count);
            entry.total += count;
            if (row.validation_status === 'approved')
                entry.approved += count;
            else if (row.validation_status === 'rejected')
                entry.rejected += count;
            else
                entry.pending += count;
        }
        return map;
    }
    async loadEvidenceByIndicatorMap() {
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
            .andWhere('(d.indicator_id IS NOT NULL OR d.indicator_progress_id IS NOT NULL)')
            .orderBy('d.uploaded_at', 'DESC')
            .getRawMany();
        const map = new Map();
        for (const row of rows) {
            if (!row.indicator_id)
                continue;
            if (!map.has(row.indicator_id))
                map.set(row.indicator_id, []);
            map.get(row.indicator_id).push({
                id: row.id,
                title: row.title,
                document_type: row.document_type,
                file_url: row.file_url,
            });
        }
        return map;
    }
    async loadGlobalSubStats(dateFrom, dateTo) {
        const [row] = await this.indicatorRepo.manager.query(`SELECT
         COUNT(*)::int                                              AS total,
         COUNT(*) FILTER (WHERE validation_status = 'approved')::int AS approved,
         COUNT(*) FILTER (WHERE validation_status = 'rejected')::int AS rejected,
         COUNT(*) FILTER (WHERE validation_status = 'pending')::int  AS pending,
         COUNT(*) FILTER (WHERE on_site = false)::int               AS off_site
       FROM submissions
       WHERE ($1::timestamptz IS NULL OR submitted_at >= $1)
         AND ($2::timestamptz IS NULL OR submitted_at <= $2)`, [dateFrom ?? null, dateTo ?? null]);
        return {
            totalSubs: Number(row.total),
            approvedSubs: Number(row.approved),
            rejectedSubs: Number(row.rejected),
            pendingSubs: Number(row.pending),
            offSiteSubs: Number(row.off_site),
        };
    }
    toIndicatorRow(ind, progressByIndicator, subsByIndicator, yearTargetsByIndicator, evidenceByIndicator, anchors) {
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
        const expected_at_now = (0, expected_progress_js_1.expectedAt)(helperIndicator, helperYearTargets, new Date(), { baselineDate: anchors.baselineDate });
        const expected_at_completion = anchors.completionDate
            ? (0, expected_progress_js_1.expectedAt)(helperIndicator, helperYearTargets, anchors.completionDate, {
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
    buildLogframeRows(nodes, indicators, progressByIndicator, subsByIndicator, yearTargetsByIndicator, evidenceByIndicator, anchors) {
        const { byNode, unassigned } = this.groupIndicatorsByNode(indicators);
        const { childrenMap, roots } = this.buildChildrenMap(nodes);
        const toRow = (ind) => this.toIndicatorRow(ind, progressByIndicator, subsByIndicator, yearTargetsByIndicator, evidenceByIndicator, anchors);
        const rows = [];
        const stack = roots
            .toSorted((a, b) => a.order - b.order)
            .map((n) => ({ node: n, depth: 0 }))
            .reverse();
        while (stack.length > 0) {
            const { node, depth } = stack.pop();
            rows.push({
                depth,
                type: node.type,
                code: node.code,
                title: node.title,
                indicators: (byNode.get(node.id) ?? []).map(toRow),
            });
            const children = (childrenMap.get(node.id) ?? []).sort((a, b) => a.order - b.order);
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
    groupIndicatorsByNode(indicators) {
        const byNode = new Map();
        const unassigned = [];
        for (const ind of indicators) {
            if (ind.logframe_level_id) {
                if (!byNode.has(ind.logframe_level_id))
                    byNode.set(ind.logframe_level_id, []);
                byNode.get(ind.logframe_level_id).push(ind);
            }
            else {
                unassigned.push(ind);
            }
        }
        return { byNode, unassigned };
    }
    buildChildrenMap(nodes) {
        const childrenMap = new Map();
        const roots = [];
        for (const node of nodes) {
            if (node.parent_id) {
                if (!childrenMap.has(node.parent_id))
                    childrenMap.set(node.parent_id, []);
                childrenMap.get(node.parent_id).push(node);
            }
            else {
                roots.push(node);
            }
        }
        return { childrenMap, roots };
    }
};
exports.ReportsService = ReportsService;
exports.ReportsService = ReportsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(report_entity_js_1.Report)),
    __param(1, (0, typeorm_1.InjectRepository)(indicator_entity_js_1.Indicator)),
    __param(2, (0, typeorm_1.InjectRepository)(indicator_progress_entity_js_1.IndicatorProgress)),
    __param(3, (0, typeorm_1.InjectRepository)(indicator_year_target_entity_js_1.IndicatorYearTarget)),
    __param(4, (0, typeorm_1.InjectRepository)(submission_entity_js_1.Submission)),
    __param(5, (0, typeorm_1.InjectRepository)(logframe_node_entity_js_1.LogframeNode)),
    __param(6, (0, typeorm_1.InjectRepository)(evidence_document_entity_js_1.EvidenceDocument)),
    __param(12, (0, typeorm_1.InjectRepository)(project_financing_source_entity_js_1.ProjectFinancingSource)),
    __param(13, (0, typeorm_1.InjectRepository)(project_risk_entity_js_1.ProjectRisk)),
    __param(14, (0, typeorm_1.InjectRepository)(project_covenant_entity_js_1.ProjectCovenant)),
    __param(15, (0, typeorm_1.InjectRepository)(safeguard_measure_entity_js_1.SafeguardMeasure)),
    __param(16, (0, typeorm_1.InjectRepository)(audit_finding_entity_js_1.AuditFinding)),
    __param(17, (0, typeorm_1.InjectRepository)(activity_quarterly_status_entity_js_1.ActivityQuarterlyStatus)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        mail_service_js_1.MailService,
        audit_service_js_1.AuditService,
        project_meta_service_js_1.ProjectMetaService,
        disaggregation_service_js_1.DisaggregationService,
        azure_storage_service_js_1.AzureStorageService,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        quarterly_reports_service_js_1.QuarterlyReportsService])
], ReportsService);
//# sourceMappingURL=reports.service.js.map