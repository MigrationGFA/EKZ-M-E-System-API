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
exports.DashboardService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const indicator_entity_js_1 = require("../indicators/indicator.entity.js");
const indicator_progress_entity_js_1 = require("../indicators/indicator-progress.entity.js");
const indicator_year_target_entity_js_1 = require("../indicators/indicator-year-target.entity.js");
const submission_entity_js_1 = require("../submissions/submission.entity.js");
const alert_entity_js_1 = require("../alerts/alert.entity.js");
const logframe_node_entity_js_1 = require("../logframe/logframe-node.entity.js");
const sdg_names_js_1 = require("../common/constants/sdg-names.js");
const project_meta_service_js_1 = require("../project-meta/project-meta.service.js");
const expected_progress_js_1 = require("../indicators/helpers/expected-progress.js");
const MONTH_NAMES = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
];
let DashboardService = class DashboardService {
    indicatorRepo;
    progressRepo;
    yearTargetsRepo;
    subRepo;
    alertRepo;
    nodeRepo;
    projectMetaService;
    constructor(indicatorRepo, progressRepo, yearTargetsRepo, subRepo, alertRepo, nodeRepo, projectMetaService) {
        this.indicatorRepo = indicatorRepo;
        this.progressRepo = progressRepo;
        this.yearTargetsRepo = yearTargetsRepo;
        this.subRepo = subRepo;
        this.alertRepo = alertRepo;
        this.nodeRepo = nodeRepo;
        this.projectMetaService = projectMetaService;
    }
    async getExecutive(userId, from, to) {
        const indicators = await this.indicatorRepo.find();
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
        const now = new Date();
        const subQb = this.subRepo.createQueryBuilder('s');
        if (from) {
            subQb.andWhere('s.submitted_at >= :from', { from });
        }
        else {
            const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
            subQb.andWhere('s.submitted_at >= :start', {
                start: monthStart.toISOString(),
            });
        }
        if (to) {
            subQb.andWhere('s.submitted_at <= :to', { to });
        }
        const submissionsThisMonth = await subQb.getCount();
        const pendingSync = await this.subRepo.count({
            where: { validation_status: 'pending' },
        });
        const kpis = {
            total_indicators: indicators.length,
            on_track: onTrack,
            at_risk: atRisk,
            off_track: offTrack,
            submissions_this_month: submissionsThisMonth,
            pending_sync: pendingSync,
        };
        const monthly_trend = await this.buildMonthlyTrend(indicators, from, to);
        const status_distribution = [
            { status: 'on_track', count: onTrack },
            { status: 'at_risk', count: atRisk },
            { status: 'off_track', count: offTrack },
        ];
        const sdgMap = new Map();
        for (const ind of indicators) {
            for (const sdgId of ind.sdg_ids) {
                if (!sdgMap.has(sdgId)) {
                    sdgMap.set(sdgId, { total: 0, count: 0 });
                }
                const entry = sdgMap.get(sdgId);
                const target = Number(ind.target);
                const progress = target > 0 ? (Number(ind.current_value) / target) * 100 : 0;
                entry.total += progress;
                entry.count++;
            }
        }
        const sdg_progress = Array.from(sdgMap.entries()).map(([sdgId, { total, count }]) => ({
            sdg_id: sdgId,
            name: sdg_names_js_1.SDG_NAMES[sdgId] ?? `SDG ${sdgId}`,
            progress: Math.round(total / count),
        }));
        const recentSubQb = this.subRepo
            .createQueryBuilder('s')
            .orderBy('s.submitted_at', 'DESC')
            .take(5);
        if (from) {
            recentSubQb.andWhere('s.submitted_at >= :from', { from });
        }
        if (to) {
            recentSubQb.andWhere('s.submitted_at <= :to', { to });
        }
        const recentSubs = await recentSubQb.getMany();
        const recent_submissions = recentSubs.map((s) => ({
            id: s.id,
            formId: s.form_id,
            officerId: s.officer_id,
            data: s.data,
            location: s.location,
            location_id: s.location_id,
            on_site: s.on_site,
            submittedAt: s.submitted_at,
            validation_status: s.validation_status,
            validation_comment: s.validation_comment,
        }));
        const recentAlerts = await this.alertRepo.find({
            where: { user_id: userId, is_read: false },
            order: { created_at: 'DESC' },
            take: 3,
        });
        const recent_alerts = recentAlerts.map((a) => ({
            id: a.id,
            title: a.title,
            description: a.description,
            type: a.type,
            isRead: a.is_read,
            timestamp: a.created_at,
        }));
        const components = await this.buildComponentCards(indicators);
        const alerts_open = await this.alertRepo.count({
            where: { is_read: false },
        });
        return {
            kpis,
            monthly_trend,
            status_distribution,
            sdg_progress,
            recent_submissions,
            recent_alerts,
            components,
            alerts_open,
        };
    }
    async buildComponentCards(indicators) {
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
        const indByNode = new Map();
        for (const ind of indicators) {
            if (!ind.logframe_level_id)
                continue;
            const list = indByNode.get(ind.logframe_level_id) ?? [];
            list.push(ind);
            indByNode.set(ind.logframe_level_id, list);
        }
        return components.map((c) => this.toComponentCard(c, childrenByParent, indByNode));
    }
    toComponentCard(component, childrenByParent, indByNode) {
        const descendantIds = [];
        const stack = [component.id];
        while (stack.length > 0) {
            const id = stack.pop();
            const kids = childrenByParent.get(id) ?? [];
            for (const k of kids) {
                descendantIds.push(k.id);
                stack.push(k.id);
            }
        }
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
        };
    }
    async buildMonthlyTrend(indicators, from, to) {
        const now = new Date();
        const totalTarget = indicators.reduce((s, i) => s + Number(i.target), 0);
        const months = [];
        for (let i = 5; i >= 0; i--) {
            const start = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const end = new Date(start.getFullYear(), start.getMonth() + 1, 0, 23, 59, 59, 999);
            months.push({ start, end, label: MONTH_NAMES[start.getMonth()] });
        }
        const yearTargetRows = await this.yearTargetsRepo.find();
        const yearTargetsByInd = new Map();
        for (const yt of yearTargetRows) {
            if (!yearTargetsByInd.has(yt.indicator_id))
                yearTargetsByInd.set(yt.indicator_id, []);
            yearTargetsByInd.get(yt.indicator_id).push(yt);
        }
        let baselineDate;
        try {
            const meta = await this.projectMetaService.get();
            baselineDate = new Date(Date.UTC(meta.baseline_year, 0, 1));
        }
        catch (e) {
            if (!(e instanceof common_1.NotFoundException))
                throw e;
        }
        const expectedByMonth = months.map((m) => {
            let totalExpected = 0;
            for (const ind of indicators) {
                const yts = yearTargetsByInd.get(ind.id) ?? [];
                totalExpected += (0, expected_progress_js_1.expectedAt)({
                    target_mode: ind.target_mode,
                    target: Number(ind.target),
                    baseline: Number(ind.baseline),
                }, yts.map((y) => ({
                    year: y.year,
                    target_value: Number(y.target_value),
                })), m.end, { baselineDate });
            }
            return totalExpected;
        });
        const rangeStart = months[0].start;
        const rangeEnd = months[months.length - 1].end;
        const progressQb = this.progressRepo
            .createQueryBuilder('p')
            .select("DATE_TRUNC('month', p.date)", 'month')
            .addSelect('SUM(p.value)', 'actual')
            .where('p.date >= :rangeStart', {
            rangeStart: rangeStart.toISOString(),
        })
            .andWhere('p.date <= :rangeEnd', {
            rangeEnd: rangeEnd.toISOString(),
        })
            .groupBy("DATE_TRUNC('month', p.date)")
            .orderBy('month', 'ASC');
        if (from) {
            progressQb.andWhere('p.date >= :from', { from });
        }
        if (to) {
            progressQb.andWhere('p.date <= :to', { to });
        }
        const rawRows = await progressQb.getRawMany();
        const actualByMonth = new Map();
        for (const row of rawRows) {
            const d = new Date(row.month);
            const key = `${d.getFullYear()}-${String(d.getMonth()).padStart(2, '0')}`;
            actualByMonth.set(key, Number(row.actual));
        }
        if (actualByMonth.size === 0) {
            const totalActual = indicators.reduce((s, i) => s + Number(i.current_value), 0);
            return months.map((m, i) => ({
                month: m.label,
                actual: totalActual,
                target: totalTarget,
                expected: expectedByMonth[i],
            }));
        }
        return months.map((m, i) => {
            const key = `${m.start.getFullYear()}-${String(m.start.getMonth()).padStart(2, '0')}`;
            return {
                month: m.label,
                actual: actualByMonth.get(key) ?? 0,
                target: totalTarget,
                expected: expectedByMonth[i],
            };
        });
    }
};
exports.DashboardService = DashboardService;
exports.DashboardService = DashboardService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(indicator_entity_js_1.Indicator)),
    __param(1, (0, typeorm_1.InjectRepository)(indicator_progress_entity_js_1.IndicatorProgress)),
    __param(2, (0, typeorm_1.InjectRepository)(indicator_year_target_entity_js_1.IndicatorYearTarget)),
    __param(3, (0, typeorm_1.InjectRepository)(submission_entity_js_1.Submission)),
    __param(4, (0, typeorm_1.InjectRepository)(alert_entity_js_1.Alert)),
    __param(5, (0, typeorm_1.InjectRepository)(logframe_node_entity_js_1.LogframeNode)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        project_meta_service_js_1.ProjectMetaService])
], DashboardService);
//# sourceMappingURL=dashboard.service.js.map