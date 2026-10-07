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
exports.IndicatorsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const indicator_entity_js_1 = require("./indicator.entity.js");
const indicator_progress_entity_js_1 = require("./indicator-progress.entity.js");
const indicator_year_target_entity_js_1 = require("./indicator-year-target.entity.js");
const form_entity_js_1 = require("../forms/form.entity.js");
const compute_status_js_1 = require("./helpers/compute-status.js");
const expected_progress_js_1 = require("./helpers/expected-progress.js");
const users_service_js_1 = require("../users/users.service.js");
const mail_service_js_1 = require("../mail/mail.service.js");
const audit_service_js_1 = require("../audit/audit.service.js");
const alerts_service_js_1 = require("../alerts/alerts.service.js");
const project_meta_service_js_1 = require("../project-meta/project-meta.service.js");
const disaggregation_service_js_1 = require("./disaggregation.service.js");
let IndicatorsService = class IndicatorsService {
    indicatorRepo;
    progressRepo;
    yearTargetsRepo;
    formRepo;
    usersService;
    mailService;
    auditService;
    alertsService;
    projectMetaService;
    disaggregationService;
    constructor(indicatorRepo, progressRepo, yearTargetsRepo, formRepo, usersService, mailService, auditService, alertsService, projectMetaService, disaggregationService) {
        this.indicatorRepo = indicatorRepo;
        this.progressRepo = progressRepo;
        this.yearTargetsRepo = yearTargetsRepo;
        this.formRepo = formRepo;
        this.usersService = usersService;
        this.mailService = mailService;
        this.auditService = auditService;
        this.alertsService = alertsService;
        this.projectMetaService = projectMetaService;
        this.disaggregationService = disaggregationService;
    }
    async findAll(filters) {
        const qb = this.indicatorRepo.createQueryBuilder('i');
        if (filters.status) {
            qb.andWhere('i.status = :status', { status: filters.status });
        }
        if (filters.logframe_level_id) {
            qb.andWhere('i.logframe_level_id = :lfId', {
                lfId: filters.logframe_level_id,
            });
        }
        if (filters.sdg_id) {
            qb.andWhere(':sdgId = ANY(i.sdg_ids)', { sdgId: filters.sdg_id });
        }
        if (filters.frequency) {
            qb.andWhere('i.frequency = :frequency', {
                frequency: filters.frequency,
            });
        }
        if (filters.kind) {
            qb.andWhere('i.kind = :kind', { kind: filters.kind });
        }
        if (filters.rmf_adoa !== undefined) {
            qb.andWhere('i.rmf_adoa = :rmf', { rmf: filters.rmf_adoa });
        }
        if (filters.data_source_type) {
            qb.andWhere('i.data_source_type = :dst', {
                dst: filters.data_source_type,
            });
        }
        if (filters.search) {
            qb.andWhere('(i.name ILIKE :search OR i.code ILIKE :search)', {
                search: `%${filters.search}%`,
            });
        }
        const total = await qb.getCount();
        if (filters.page && filters.per_page) {
            qb.skip((filters.page - 1) * filters.per_page).take(filters.per_page);
        }
        qb.orderBy('i.created_at', 'DESC');
        const indicators = await qb.getMany();
        return {
            data: indicators.map((i) => this.serialize(i)),
            total,
            page: filters.page ?? 1,
            per_page: filters.per_page ?? total,
        };
    }
    async findOne(id) {
        const indicator = await this.indicatorRepo.findOne({ where: { id } });
        if (!indicator)
            throw new common_1.NotFoundException('Indicator not found');
        return this.serialize(indicator);
    }
    async create(dto, actorId, actorName) {
        const baseline = dto.baseline ?? 0;
        const status = (0, compute_status_js_1.computeStatus)(baseline, dto.target);
        const indicator = this.indicatorRepo.create({
            ...dto,
            baseline,
            current_value: baseline,
            status,
            sdg_ids: dto.sdg_ids ?? [],
            logframe_level_id: dto.logframe_level_id ?? null,
        });
        const saved = await this.indicatorRepo.save(indicator);
        const result = this.serialize(saved);
        void this.auditService.log({
            user_id: actorId,
            user_name: actorName,
            action: 'create',
            resource: 'indicator',
            resource_id: saved.id,
            after_data: result,
        });
        return result;
    }
    async update(id, dto, actorId, actorName) {
        const indicator = await this.indicatorRepo.findOne({ where: { id } });
        if (!indicator)
            throw new common_1.NotFoundException('Indicator not found');
        const beforeData = this.serialize(indicator);
        const oldStatus = indicator.status;
        const updates = Object.fromEntries(Object.entries(dto).filter(([, v]) => v !== undefined));
        Object.assign(indicator, updates);
        if (dto.current_value !== undefined || dto.target !== undefined) {
            const expected = await this.getExpectedAt(indicator, new Date());
            indicator.status = (0, compute_status_js_1.computeStatus)(Number(indicator.current_value), expected);
        }
        const saved = await this.indicatorRepo.save(indicator);
        this.notifyStatusChangeIfNeeded(oldStatus, saved.status, saved.name, saved.code);
        const afterData = this.serialize(saved);
        void this.auditService.log({
            user_id: actorId,
            user_name: actorName,
            action: 'update',
            resource: 'indicator',
            resource_id: saved.id,
            before_data: beforeData,
            after_data: afterData,
        });
        return afterData;
    }
    async remove(id, actorId, actorName) {
        const indicator = await this.indicatorRepo.findOne({ where: { id } });
        if (!indicator)
            throw new common_1.NotFoundException('Indicator not found');
        const beforeData = this.serialize(indicator);
        try {
            const submissions = await this.indicatorRepo.manager.query(`SELECT COUNT(*) as count FROM submissions s
         JOIN forms f ON s.form_id = f.id
         WHERE $1 = ANY(f.indicator_ids)`, [id]);
            if (submissions[0]?.count > 0) {
                throw new common_1.ConflictException('Cannot delete indicator with linked submissions');
            }
        }
        catch (e) {
            if (e instanceof common_1.ConflictException)
                throw e;
        }
        await this.indicatorRepo.remove(indicator);
        void this.auditService.log({
            user_id: actorId,
            user_name: actorName,
            action: 'delete',
            resource: 'indicator',
            resource_id: id,
            before_data: beforeData,
        });
    }
    async getProgress(id, from, to) {
        const indicator = await this.indicatorRepo.findOne({ where: { id } });
        if (!indicator)
            throw new common_1.NotFoundException('Indicator not found');
        const qb = this.progressRepo
            .createQueryBuilder('p')
            .where('p.indicator_id = :id', { id })
            .orderBy('p.date', 'ASC');
        if (from) {
            qb.andWhere('p.date >= :from', { from });
        }
        if (to) {
            qb.andWhere('p.date <= :to', { to });
        }
        const entries = await qb.getMany();
        return entries.map((e) => ({
            id: e.id,
            indicatorId: e.indicator_id,
            value: Number(e.value),
            date: e.date,
            notes: e.notes,
            submittedBy: e.submitted_by,
        }));
    }
    async getLinkedForms(indicatorId) {
        const indicator = await this.indicatorRepo.findOne({
            where: { id: indicatorId },
        });
        if (!indicator)
            throw new common_1.NotFoundException('Indicator not found');
        const forms = await this.formRepo
            .createQueryBuilder('f')
            .where(':indicatorId = ANY(f.indicator_ids)', { indicatorId })
            .orderBy('f.created_at', 'DESC')
            .getMany();
        return forms.map((f) => ({
            id: f.id,
            title: f.title,
            description: f.description,
            fields: f.fields,
            indicator_ids: f.indicator_ids,
            assigned_to: f.assigned_to,
            created_by: f.created_by,
            status: f.status,
            createdAt: f.created_at,
        }));
    }
    async addProgress(indicatorId, dto, actorId, actorName) {
        const indicator = await this.indicatorRepo.findOne({
            where: { id: indicatorId },
        });
        if (!indicator)
            throw new common_1.NotFoundException('Indicator not found');
        const oldStatus = indicator.status;
        const progress = this.progressRepo.create({
            indicator_id: indicatorId,
            value: dto.value,
            date: new Date(dto.date),
            notes: dto.notes ?? null,
            submitted_by: dto.submittedBy,
        });
        const savedProgress = await this.progressRepo.save(progress);
        if (dto.breakdowns?.length) {
            await this.disaggregationService.persistBreakdowns(savedProgress.id, Number(dto.value), dto.breakdowns);
        }
        const latestEntry = await this.progressRepo.findOne({
            where: { indicator_id: indicatorId },
            order: { date: 'DESC' },
        });
        if (latestEntry && latestEntry.id === savedProgress.id) {
            indicator.current_value = dto.value;
            const expected = await this.getExpectedAt(indicator, new Date());
            indicator.status = (0, compute_status_js_1.computeStatus)(Number(dto.value), expected);
            await this.indicatorRepo.save(indicator);
            this.notifyStatusChangeIfNeeded(oldStatus, indicator.status, indicator.name, indicator.code);
        }
        const progressResult = {
            id: savedProgress.id,
            indicatorId: indicator.id,
            value: Number(savedProgress.value),
            date: savedProgress.date,
            notes: savedProgress.notes,
            submittedBy: savedProgress.submitted_by,
        };
        void this.auditService.log({
            user_id: actorId,
            user_name: actorName,
            action: 'create',
            resource: 'indicator_progress',
            resource_id: savedProgress.id,
            after_data: progressResult,
        });
        return progressResult;
    }
    async getYearTargets(indicatorId) {
        const indicator = await this.indicatorRepo.findOne({
            where: { id: indicatorId },
        });
        if (!indicator)
            throw new common_1.NotFoundException('Indicator not found');
        const rows = await this.yearTargetsRepo.find({
            where: { indicator_id: indicatorId },
            order: { year: 'ASC', is_original: 'DESC' },
        });
        return this.serializeYearTargets(rows);
    }
    async setYearTargets(indicatorId, dto, actorId, actorName) {
        const indicator = await this.indicatorRepo.findOne({
            where: { id: indicatorId },
        });
        if (!indicator)
            throw new common_1.NotFoundException('Indicator not found');
        const years = dto.targets.map((t) => t.year);
        if (new Set(years).size !== years.length) {
            throw new common_1.BadRequestException('Duplicate years in year-targets payload');
        }
        const beforeRows = await this.yearTargetsRepo.find({
            where: { indicator_id: indicatorId },
            order: { year: 'ASC', is_original: 'DESC' },
        });
        const currentYear = new Date().getUTCFullYear();
        const saved = await this.indicatorRepo.manager.transaction(async (em) => {
            await em.delete(indicator_year_target_entity_js_1.IndicatorYearTarget, {
                indicator_id: indicatorId,
                is_original: false,
            });
            if (dto.targets.length === 0) {
                return em.find(indicator_year_target_entity_js_1.IndicatorYearTarget, {
                    where: { indicator_id: indicatorId },
                    order: { year: 'ASC', is_original: 'DESC' },
                });
            }
            const rows = dto.targets.map((t) => em.create(indicator_year_target_entity_js_1.IndicatorYearTarget, {
                indicator_id: indicatorId,
                year: t.year,
                target_value: t.target_value,
                notes: t.notes ?? null,
                is_original: false,
                revision_year: currentYear,
            }));
            await em.save(indicator_year_target_entity_js_1.IndicatorYearTarget, rows);
            return em.find(indicator_year_target_entity_js_1.IndicatorYearTarget, {
                where: { indicator_id: indicatorId },
                order: { year: 'ASC', is_original: 'DESC' },
            });
        });
        saved.sort((a, b) => a.year - b.year);
        const oldStatus = indicator.status;
        const expected = await this.getExpectedAt(indicator, new Date());
        indicator.status = (0, compute_status_js_1.computeStatus)(Number(indicator.current_value), expected);
        if (indicator.status !== oldStatus) {
            await this.indicatorRepo.save(indicator);
            this.notifyStatusChangeIfNeeded(oldStatus, indicator.status, indicator.name, indicator.code);
        }
        const beforeData = this.serializeYearTargets(beforeRows);
        const afterData = this.serializeYearTargets(saved);
        void this.auditService.log({
            user_id: actorId,
            user_name: actorName,
            action: 'update',
            resource: 'indicator_year_targets',
            resource_id: indicatorId,
            before_data: beforeData,
            after_data: afterData,
        });
        return afterData;
    }
    async getExpectedAt(indicator, asOf) {
        return this.getExpectedForIndicator(indicator, asOf);
    }
    async getExpectedForIndicator(indicator, asOf) {
        const yearTargets = await this.getLatestYearTargets(indicator.id);
        let baselineDate;
        try {
            const meta = await this.projectMetaService.get();
            baselineDate = new Date(Date.UTC(meta.baseline_year, 0, 1));
        }
        catch (e) {
            if (!(e instanceof common_1.NotFoundException))
                throw e;
        }
        return (0, expected_progress_js_1.expectedAt)({
            target_mode: indicator.target_mode,
            target: Number(indicator.target),
            baseline: Number(indicator.baseline),
        }, yearTargets.map((t) => ({
            year: t.year,
            target_value: Number(t.target_value),
        })), asOf, { baselineDate });
    }
    async getLatestYearTargets(indicatorId) {
        const allRows = await this.yearTargetsRepo.find({
            where: { indicator_id: indicatorId },
        });
        const sorted = [...allRows].sort((a, b) => {
            if (a.year !== b.year)
                return a.year - b.year;
            return (a.is_original ? 1 : 0) - (b.is_original ? 1 : 0);
        });
        const byYear = new Map();
        for (const row of sorted) {
            if (!byYear.has(row.year))
                byYear.set(row.year, row);
        }
        return Array.from(byYear.values()).sort((a, b) => a.year - b.year);
    }
    serializeYearTargets(rows) {
        return rows.map((r) => ({
            id: r.id,
            indicator_id: r.indicator_id,
            year: r.year,
            target_value: Number(r.target_value),
            notes: r.notes,
            is_original: r.is_original,
            revision_year: r.revision_year,
            createdAt: r.created_at,
            updatedAt: r.updated_at,
        }));
    }
    notifyStatusChangeIfNeeded(oldStatus, newStatus, name, code) {
        if (newStatus === oldStatus)
            return;
        if (!['at_risk', 'off_track'].includes(newStatus))
            return;
        void this.usersService.findAdminAndMeStaff().then((admins) => {
            const emails = admins.map((u) => u.email);
            if (emails.length === 0)
                return;
            void this.mailService.sendIndicatorStatusAlert(emails, name, code, newStatus);
            const title = `Indicator ${newStatus === 'off_track' ? 'Off Track' : 'At Risk'}: ${code}`;
            const description = `"${name}" has moved to ${newStatus}. Review and take corrective action.`;
            for (const admin of admins) {
                void this.alertsService.create({
                    user_id: admin.id,
                    user_email: admin.email,
                    title,
                    description,
                    type: 'missed_target',
                });
            }
        });
    }
    serialize(ind) {
        return {
            id: ind.id,
            code: ind.code,
            name: ind.name,
            description: ind.description,
            level: ind.level,
            unit: ind.unit,
            baseline: Number(ind.baseline),
            target: Number(ind.target),
            current_value: Number(ind.current_value),
            status: ind.status,
            frequency: ind.frequency,
            kind: ind.kind,
            methodology: ind.methodology,
            rmf_adoa: ind.rmf_adoa,
            target_mode: ind.target_mode,
            data_source_type: ind.data_source_type,
            reporting_year_start: ind.reporting_year_start,
            reporting_year_end: ind.reporting_year_end,
            logframe_level_id: ind.logframe_level_id,
            sdg_ids: ind.sdg_ids,
            responsible_party: ind.responsible_party,
            means_of_verification: ind.means_of_verification,
            createdAt: ind.created_at,
            updatedAt: ind.updated_at,
        };
    }
};
exports.IndicatorsService = IndicatorsService;
exports.IndicatorsService = IndicatorsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(indicator_entity_js_1.Indicator)),
    __param(1, (0, typeorm_1.InjectRepository)(indicator_progress_entity_js_1.IndicatorProgress)),
    __param(2, (0, typeorm_1.InjectRepository)(indicator_year_target_entity_js_1.IndicatorYearTarget)),
    __param(3, (0, typeorm_1.InjectRepository)(form_entity_js_1.Form)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        users_service_js_1.UsersService,
        mail_service_js_1.MailService,
        audit_service_js_1.AuditService,
        alerts_service_js_1.AlertsService,
        project_meta_service_js_1.ProjectMetaService,
        disaggregation_service_js_1.DisaggregationService])
], IndicatorsService);
//# sourceMappingURL=indicators.service.js.map