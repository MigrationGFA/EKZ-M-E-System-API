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
var SchedulerService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SchedulerService = void 0;
const common_1 = require("@nestjs/common");
const schedule_1 = require("@nestjs/schedule");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const indicator_entity_js_1 = require("../indicators/indicator.entity.js");
const indicator_year_target_entity_js_1 = require("../indicators/indicator-year-target.entity.js");
const alerts_service_js_1 = require("../alerts/alerts.service.js");
const users_service_js_1 = require("../users/users.service.js");
const project_meta_service_js_1 = require("../project-meta/project-meta.service.js");
const expected_progress_js_1 = require("../indicators/helpers/expected-progress.js");
const overdue_js_1 = require("./helpers/overdue.js");
const CALENDAR_DEDUP_DAYS = {
    monthly: 15,
    quarterly: 30,
    bi_annually: 60,
    annually: 90,
};
const MID_TERM_DEDUP_DAYS = 10_000;
const ONE_OFF_DEDUP_DAYS = 10_000;
const AT_RISK_DEDUP_DAYS = 7;
const AT_RISK_RATIO_THRESHOLD = 0.6;
const MS_PER_DAY = 86_400_000;
let SchedulerService = SchedulerService_1 = class SchedulerService {
    indicatorRepo;
    yearTargetsRepo;
    alertsService;
    usersService;
    projectMetaService;
    logger = new common_1.Logger(SchedulerService_1.name);
    constructor(indicatorRepo, yearTargetsRepo, alertsService, usersService, projectMetaService) {
        this.indicatorRepo = indicatorRepo;
        this.yearTargetsRepo = yearTargetsRepo;
        this.alertsService = alertsService;
        this.usersService = usersService;
        this.projectMetaService = projectMetaService;
    }
    async checkDeadlines() {
        this.logger.log('Running scheduler tick…');
        const now = new Date();
        const [indicators, recipients] = await Promise.all([
            this.indicatorRepo.find(),
            this.usersService.findAdminAndMeStaff(),
        ]);
        if (recipients.length === 0) {
            this.logger.log('Scheduler tick: no admin/me_staff recipients.');
            return;
        }
        if (indicators.length === 0) {
            this.logger.log('Scheduler tick: no indicators to check.');
            return;
        }
        const lastProgressMap = await this.loadLastProgress();
        const projectMeta = await this.loadProjectMeta();
        const yearTargetsByIndicator = await this.loadYearTargets(indicators.map((i) => i.id));
        const baselineDate = projectMeta
            ? new Date(Date.UTC(projectMeta.baseline_year, 0, 1))
            : undefined;
        let overdueCount = 0;
        let atRiskCount = 0;
        for (const indicator of indicators) {
            const lastDate = lastProgressMap.get(indicator.id) ??
                (indicator.created_at ? new Date(indicator.created_at) : null);
            const overdueResult = (0, overdue_js_1.isOverdue)({ frequency: indicator.frequency }, lastDate, projectMeta ? this.toOverdueMeta(projectMeta) : null, now);
            if (overdueResult.overdue) {
                overdueCount += await this.emitOverdueAlerts(indicator, overdueResult, recipients, now);
            }
            const expected = (0, expected_progress_js_1.expectedAt)({
                target_mode: indicator.target_mode,
                target: Number(indicator.target),
                baseline: Number(indicator.baseline),
            }, yearTargetsByIndicator.get(indicator.id)?.map((t) => ({
                year: t.year,
                target_value: Number(t.target_value),
            })) ?? [], now, { baselineDate });
            if (expected > 0) {
                const ratio = Number(indicator.current_value) / expected;
                if (ratio < AT_RISK_RATIO_THRESHOLD) {
                    atRiskCount += await this.emitAtRiskAlerts(indicator, expected, ratio, recipients, now);
                }
            }
        }
        this.logger.log(`Scheduler tick complete — emitted ${overdueCount} overdue + ${atRiskCount} at-risk alerts.`);
    }
    async loadLastProgress() {
        const rows = await this
            .indicatorRepo.manager.query(`
        SELECT indicator_id, MAX(date) as last_date
        FROM indicator_progress
        GROUP BY indicator_id
      `);
        return new Map(rows.map((r) => [r.indicator_id, new Date(r.last_date)]));
    }
    async loadProjectMeta() {
        try {
            const meta = await this.projectMetaService.get();
            return {
                midpoint_date: meta.midpoint_date ? new Date(meta.midpoint_date) : null,
                completion_year: meta.completion_year,
                baseline_year: meta.baseline_year,
            };
        }
        catch (e) {
            if (e instanceof common_1.NotFoundException)
                return null;
            throw e;
        }
    }
    async loadYearTargets(indicatorIds) {
        if (indicatorIds.length === 0)
            return new Map();
        const rows = await this.yearTargetsRepo.find({
            where: { indicator_id: (0, typeorm_2.In)(indicatorIds) },
            order: { year: 'ASC' },
        });
        const map = new Map();
        for (const r of rows) {
            const list = map.get(r.indicator_id) ?? [];
            list.push(r);
            map.set(r.indicator_id, list);
        }
        return map;
    }
    toOverdueMeta(meta) {
        return {
            midpoint_date: meta.midpoint_date,
            completion_year: meta.completion_year,
        };
    }
    async emitOverdueAlerts(indicator, result, recipients, now) {
        const titlePrefix = this.overdueTitlePrefix(indicator, result);
        const description = this.overdueDescription(indicator, result);
        const dedupDays = this.overdueDedupDays(indicator.frequency);
        const since = new Date(now.getTime() - dedupDays * MS_PER_DAY);
        let emitted = 0;
        for (const recipient of recipients) {
            const recent = await this.alertsService.hasRecentAlert({
                user_id: recipient.id,
                type: 'deadline',
                title_prefix: titlePrefix,
                since,
            });
            if (recent)
                continue;
            void this.alertsService.create({
                user_id: recipient.id,
                user_email: recipient.email,
                title: titlePrefix,
                description,
                type: 'deadline',
                sendEmail: false,
            });
            emitted += 1;
        }
        return emitted;
    }
    async emitAtRiskAlerts(indicator, expected, ratio, recipients, now) {
        const titlePrefix = `Off Track: ${indicator.code}`;
        const description = `Indicator "${indicator.name}" is at ${(ratio * 100).toFixed(1)}% of the expected ${expected.toFixed(2)} ${indicator.unit} at ${now.toISOString().slice(0, 10)} ` +
            `(current ${Number(indicator.current_value).toFixed(2)}). Review and take corrective action.`;
        const since = new Date(now.getTime() - AT_RISK_DEDUP_DAYS * MS_PER_DAY);
        let emitted = 0;
        for (const recipient of recipients) {
            const recent = await this.alertsService.hasRecentAlert({
                user_id: recipient.id,
                type: 'missed_target',
                title_prefix: titlePrefix,
                since,
            });
            if (recent)
                continue;
            void this.alertsService.create({
                user_id: recipient.id,
                user_email: recipient.email,
                title: titlePrefix,
                description,
                type: 'missed_target',
                sendEmail: false,
            });
            emitted += 1;
        }
        return emitted;
    }
    overdueTitlePrefix(indicator, result) {
        switch (result.reason) {
            case 'mid_term_window':
                return `Mid-term Reporting Missed: ${indicator.code}`;
            case 'one_off_post_completion':
                return `One-off Indicator Has No Data: ${indicator.code}`;
            case 'calendar':
            default:
                return `Reporting Overdue: ${indicator.code}`;
        }
    }
    overdueDescription(indicator, result) {
        const base = `Indicator "${indicator.name}" (${indicator.frequency})`;
        switch (result.reason) {
            case 'mid_term_window':
                return result.daysSince === null
                    ? `${base} has no progress entries; the mid-term reporting window has passed.`
                    : `${base}'s last progress entry is ${result.daysSince} days old and falls outside the ±90-day mid-term reporting window.`;
            case 'one_off_post_completion':
                return `${base} has no progress entries and the project completion year has passed. A one-off reading is overdue.`;
            case 'calendar':
            default:
                return result.daysSince === null
                    ? `${base} has no progress entries on file. A progress reading is overdue.`
                    : `${base} has not been updated in ${result.daysSince} days. A progress entry is overdue.`;
        }
    }
    overdueDedupDays(frequency) {
        if (frequency === 'mid_term')
            return MID_TERM_DEDUP_DAYS;
        if (frequency === 'one_off')
            return ONE_OFF_DEDUP_DAYS;
        return CALENDAR_DEDUP_DAYS[frequency] ?? 7;
    }
};
exports.SchedulerService = SchedulerService;
__decorate([
    (0, schedule_1.Cron)(schedule_1.CronExpression.EVERY_DAY_AT_8AM),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], SchedulerService.prototype, "checkDeadlines", null);
exports.SchedulerService = SchedulerService = SchedulerService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(indicator_entity_js_1.Indicator)),
    __param(1, (0, typeorm_1.InjectRepository)(indicator_year_target_entity_js_1.IndicatorYearTarget)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        alerts_service_js_1.AlertsService,
        users_service_js_1.UsersService,
        project_meta_service_js_1.ProjectMetaService])
], SchedulerService);
//# sourceMappingURL=scheduler.service.js.map