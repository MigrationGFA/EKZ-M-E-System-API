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
var SubmissionsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SubmissionsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const submission_entity_js_1 = require("./submission.entity.js");
const project_location_entity_js_1 = require("../locations/project-location.entity.js");
const form_entity_js_1 = require("../forms/form.entity.js");
const geofence_js_1 = require("./helpers/geofence.js");
const users_service_js_1 = require("../users/users.service.js");
const mail_service_js_1 = require("../mail/mail.service.js");
const audit_service_js_1 = require("../audit/audit.service.js");
const alerts_service_js_1 = require("../alerts/alerts.service.js");
const indicators_service_js_1 = require("../indicators/indicators.service.js");
const beneficiary_entity_js_1 = require("../beneficiaries/beneficiary.entity.js");
const derive_cohorts_js_1 = require("../beneficiaries/helpers/derive-cohorts.js");
let SubmissionsService = SubmissionsService_1 = class SubmissionsService {
    subRepo;
    locRepo;
    formRepo;
    beneficiaryRepo;
    usersService;
    mailService;
    auditService;
    alertsService;
    indicatorsService;
    logger = new common_1.Logger(SubmissionsService_1.name);
    constructor(subRepo, locRepo, formRepo, beneficiaryRepo, usersService, mailService, auditService, alertsService, indicatorsService) {
        this.subRepo = subRepo;
        this.locRepo = locRepo;
        this.formRepo = formRepo;
        this.beneficiaryRepo = beneficiaryRepo;
        this.usersService = usersService;
        this.mailService = mailService;
        this.auditService = auditService;
        this.alertsService = alertsService;
        this.indicatorsService = indicatorsService;
    }
    async findAll(filters) {
        const qb = this.subRepo.createQueryBuilder('s');
        if (filters.form_id) {
            qb.andWhere('s.form_id = :formId', { formId: filters.form_id });
        }
        if (filters.officer_id) {
            qb.andWhere('s.officer_id = :officerId', {
                officerId: filters.officer_id,
            });
        }
        if (filters.validation_status) {
            qb.andWhere('s.validation_status = :vs', {
                vs: filters.validation_status,
            });
        }
        const total = await qb.getCount();
        if (filters.page && filters.per_page) {
            qb.skip((filters.page - 1) * filters.per_page).take(filters.per_page);
        }
        qb.orderBy('s.submitted_at', 'DESC');
        const subs = await qb.getMany();
        return {
            data: subs.map((s) => this.serialize(s)),
            total,
            page: filters.page ?? 1,
            per_page: filters.per_page ?? total,
        };
    }
    async findOne(id) {
        const sub = await this.subRepo.findOne({ where: { id } });
        if (!sub)
            throw new common_1.NotFoundException('Submission not found');
        return this.serialize(sub);
    }
    async create(dto, actorId, actorName) {
        const form = await this.formRepo.findOne({ where: { id: dto.formId } });
        if (!form) {
            throw new common_1.UnprocessableEntityException(`Form ${dto.formId} does not exist`);
        }
        if (form.require_gps && !dto.location) {
            throw new common_1.BadRequestException('GPS capture is required for this form');
        }
        const existing = await this.subRepo.findOne({ where: { id: dto.id } });
        if (existing) {
            throw new common_1.ConflictException(`Submission with id ${dto.id} already exists`);
        }
        const locations = await this.locRepo.find();
        const allowedLocations = form.location_ids?.length
            ? locations.filter((l) => form.location_ids.includes(l.id))
            : locations;
        const geo = (0, geofence_js_1.applyGeofence)(dto.location ?? null, allowedLocations);
        const sub = this.subRepo.create({
            id: dto.id,
            form_id: dto.formId,
            officer_id: dto.officerId,
            data: dto.data,
            location: dto.location ?? null,
            submitted_at: new Date(dto.submittedAt),
            location_id: geo.location_id,
            on_site: geo.on_site,
            beneficiary_id: dto.beneficiaryId ?? null,
        });
        const saved = await this.subRepo.save(sub);
        void this.auditService.log({
            user_id: actorId,
            user_name: actorName,
            action: 'submit',
            resource: 'submission',
            resource_id: saved.id,
            after_data: {
                formId: dto.formId,
                officerId: dto.officerId,
                on_site: geo.on_site,
            },
        });
        if (geo.on_site === false) {
            void this.notifyOffSite(saved.id, dto.officerId);
        }
        const officer = await this.usersService.findById(dto.officerId);
        if (officer) {
            void this.alertsService.create({
                user_id: officer.id,
                user_email: officer.email,
                title: 'Submission Synced',
                description: `Your submission for form ${dto.formId} was received and recorded successfully.`,
                type: 'sync_success',
            });
        }
        return { id: saved.id, status: 'accepted' };
    }
    async createBatch(dtos, actorId, actorName) {
        const accepted = [];
        const rejected = [];
        const locations = await this.locRepo.find();
        const adminRecipients = await this.usersService.findAdminAndMeStaff();
        const adminEmails = adminRecipients.map((u) => u.email);
        const incomingIds = dtos.map((d) => d.id);
        const existingRows = await this.subRepo.find({
            where: { id: (0, typeorm_2.In)(incomingIds) },
            select: ['id'],
        });
        const existingIds = new Set(existingRows.map((r) => r.id));
        const uniqueFormIds = [...new Set(dtos.map((d) => d.formId))];
        const validForms = await this.formRepo.find({
            where: { id: (0, typeorm_2.In)(uniqueFormIds) },
        });
        const formConfigMap = new Map(validForms.map((f) => [f.id, f]));
        const validFormIds = new Set(validForms.map((f) => f.id));
        for (const dto of dtos) {
            try {
                if (existingIds.has(dto.id)) {
                    accepted.push(dto.id);
                    continue;
                }
                if (!validFormIds.has(dto.formId)) {
                    rejected.push({
                        id: dto.id,
                        reason: `Form ${dto.formId} does not exist`,
                    });
                    continue;
                }
                const result = await this.processBatchItem(dto, formConfigMap.get(dto.formId), locations, adminRecipients, adminEmails, actorId, actorName);
                if (result.ok) {
                    accepted.push(dto.id);
                }
                else {
                    rejected.push({ id: dto.id, reason: result.reason });
                }
            }
            catch (e) {
                const message = e instanceof Error ? e.message : 'Unknown error';
                rejected.push({ id: dto.id, reason: message });
            }
        }
        await this.sendSyncSuccessAlerts(dtos, accepted, existingIds);
        return { accepted, rejected };
    }
    async processBatchItem(dto, formConfig, locations, adminRecipients, adminEmails, actorId, actorName) {
        if (formConfig.require_gps && !dto.location) {
            return { ok: false, reason: 'GPS capture is required for this form' };
        }
        const allowedLocations = formConfig.location_ids?.length
            ? locations.filter((l) => formConfig.location_ids.includes(l.id))
            : locations;
        const geo = (0, geofence_js_1.applyGeofence)(dto.location ?? null, allowedLocations);
        const sub = this.subRepo.create({
            id: dto.id,
            form_id: dto.formId,
            officer_id: dto.officerId,
            data: dto.data,
            location: dto.location ?? null,
            submitted_at: new Date(dto.submittedAt),
            location_id: geo.location_id,
            on_site: geo.on_site,
            beneficiary_id: dto.beneficiaryId ?? null,
        });
        await this.subRepo.save(sub);
        void this.auditService.log({
            user_id: actorId,
            user_name: actorName,
            action: 'submit',
            resource: 'submission',
            resource_id: dto.id,
            after_data: {
                formId: dto.formId,
                officerId: dto.officerId,
                on_site: geo.on_site,
            },
        });
        if (geo.on_site === false && adminEmails.length > 0) {
            const officer = await this.usersService.findById(dto.officerId);
            const officerName = officer?.name ?? dto.officerId;
            this.mailService.sendOffSiteAlert(adminEmails, dto.id, officerName);
            for (const admin of adminRecipients) {
                void this.alertsService.create({
                    user_id: admin.id,
                    user_email: admin.email,
                    title: 'Off-Site Submission Detected',
                    description: `Submission ${dto.id} was recorded outside all project geofences. Officer: ${officerName}.`,
                    type: 'data_flag',
                });
            }
        }
        return { ok: true };
    }
    async sendSyncSuccessAlerts(dtos, accepted, existingIds) {
        const newlyAccepted = dtos.filter((d) => accepted.includes(d.id) && !existingIds.has(d.id));
        const uniqueOfficerIds = [
            ...new Set(newlyAccepted.map((d) => d.officerId)),
        ];
        for (const officerId of uniqueOfficerIds) {
            const off = await this.usersService.findById(officerId);
            if (off) {
                void this.alertsService.create({
                    user_id: off.id,
                    user_email: off.email,
                    title: 'Submissions Synced',
                    description: 'Your submissions were received and recorded successfully.',
                    type: 'sync_success',
                });
            }
        }
    }
    async validate(id, action, comment, actorId, actorName) {
        const sub = await this.subRepo.findOne({ where: { id } });
        if (!sub)
            throw new common_1.NotFoundException('Submission not found');
        const beforeStatus = sub.validation_status;
        if (sub.validation_status === 'approved') {
            throw new common_1.BadRequestException('Submission is already approved and cannot be re-validated');
        }
        if (sub.validation_status === 'rejected') {
            throw new common_1.BadRequestException('Submission is already rejected and cannot be re-validated');
        }
        sub.validation_status = action === 'approve' ? 'approved' : 'rejected';
        sub.validation_comment = comment ?? null;
        const saved = await this.subRepo.save(sub);
        if (action === 'approve') {
            await this.applyFieldMappings(saved, actorId, actorName);
        }
        void this.auditService.log({
            user_id: actorId,
            user_name: actorName,
            action: 'update',
            resource: 'submission',
            resource_id: id,
            before_data: { validation_status: beforeStatus },
            after_data: {
                validation_status: saved.validation_status,
                validation_comment: saved.validation_comment,
            },
        });
        const form = await this.formRepo.findOne({
            where: { id: sub.form_id },
            select: ['title'],
        });
        const formTitle = form?.title ?? sub.form_id;
        const validatedAt = new Date();
        const officer = await this.usersService.findById(sub.officer_id);
        if (officer) {
            if (action === 'approve') {
                void this.mailService.sendSubmissionApproved(officer.email, officer.name, id, formTitle, actorName, validatedAt);
                void this.alertsService.create({
                    user_id: officer.id,
                    user_email: officer.email,
                    title: 'Submission Approved',
                    description: `Your submission for "${formTitle}" was approved by ${actorName}. The data has been recorded in the M&E system.`,
                    type: 'submission_approved',
                });
            }
            else {
                void this.mailService.sendSubmissionRejected(officer.email, officer.name, id, formTitle, comment ?? '', actorName, validatedAt);
                void this.alertsService.create({
                    user_id: officer.id,
                    user_email: officer.email,
                    title: 'Submission Rejected',
                    description: `Your submission for "${formTitle}" was rejected by ${actorName}. Reason: ${comment ?? ''}`,
                    type: 'submission_rejected',
                });
            }
        }
        return this.serialize(saved);
    }
    async applyFieldMappings(sub, actorId, actorName) {
        const form = await this.formRepo.findOne({ where: { id: sub.form_id } });
        if (!form?.field_mappings?.length)
            return;
        const submittedDate = sub.submitted_at.toISOString().split('T')[0];
        const needsBeneficiary = sub.beneficiary_id != null &&
            form.field_mappings.some((m) => m.axis && m.beneficiary_attr);
        const beneficiary = needsBeneficiary
            ? await this.beneficiaryRepo.findOne({
                where: { id: sub.beneficiary_id },
                relations: { cohorts: true },
            })
            : null;
        for (const mapping of form.field_mappings) {
            const rawValue = sub.data[mapping.form_field_id];
            if (rawValue === undefined || rawValue === null || rawValue === '')
                continue;
            const numValue = typeof rawValue === 'number' ? rawValue : Number(rawValue);
            if (Number.isNaN(numValue))
                continue;
            const breakdowns = this.buildMappingBreakdowns(mapping, numValue, beneficiary, sub.id);
            try {
                await this.indicatorsService.addProgress(mapping.indicator_id, {
                    value: numValue,
                    date: submittedDate,
                    submittedBy: actorName,
                    notes: `Auto-linked from submission ${sub.id}`,
                    breakdowns: breakdowns.length > 0 ? breakdowns : undefined,
                }, actorId, actorName);
            }
            catch (err) {
                this.logger.warn(`Failed to auto-link progress for indicator ${mapping.indicator_id}: ${err.message}`);
            }
        }
    }
    buildMappingBreakdowns(mapping, numValue, beneficiary, submissionId) {
        if (!mapping.axis)
            return [];
        const buckets = this.bucketsForMapping(mapping, beneficiary);
        if (buckets.length === 0) {
            if (mapping.beneficiary_attr && !beneficiary) {
                this.logger.warn(`Mapping for indicator ${mapping.indicator_id} declares axis "${mapping.axis}" but submission ${submissionId} has no linked beneficiary; emitting aggregate progress without breakdown.`);
            }
            return [];
        }
        const value_breakdown = {};
        for (const bucket of buckets) {
            value_breakdown[bucket] = numValue;
        }
        return [
            {
                axis: mapping.axis,
                value_breakdown,
            },
        ];
    }
    bucketsForMapping(mapping, beneficiary) {
        const fallback = mapping.static_bucket ? [mapping.static_bucket] : [];
        if (!mapping.beneficiary_attr || !beneficiary)
            return fallback;
        switch (mapping.beneficiary_attr) {
            case 'sex':
                return beneficiary.sex ? [beneficiary.sex] : [];
            case 'age_band':
                return ageBandBucket(beneficiary) ?? fallback;
            case 'cohort':
                return (beneficiary.cohorts ?? []).map((c) => c.code);
            case 'skill_level':
                return beneficiary.skill_level ? [beneficiary.skill_level] : [];
            default:
                return [];
        }
    }
    async notifyOffSite(submissionId, officerId) {
        const admins = await this.usersService.findAdminAndMeStaff();
        if (admins.length === 0)
            return;
        const officer = await this.usersService.findById(officerId);
        const officerName = officer?.name ?? officerId;
        void this.mailService.sendOffSiteAlert(admins.map((u) => u.email), submissionId, officerName);
        for (const admin of admins) {
            void this.alertsService.create({
                user_id: admin.id,
                user_email: admin.email,
                title: 'Off-Site Submission Detected',
                description: `Submission ${submissionId} was recorded outside all project geofences. Officer: ${officerName}.`,
                type: 'data_flag',
            });
        }
    }
    serialize(s) {
        return {
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
        };
    }
};
exports.SubmissionsService = SubmissionsService;
exports.SubmissionsService = SubmissionsService = SubmissionsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(submission_entity_js_1.Submission)),
    __param(1, (0, typeorm_1.InjectRepository)(project_location_entity_js_1.ProjectLocation)),
    __param(2, (0, typeorm_1.InjectRepository)(form_entity_js_1.Form)),
    __param(3, (0, typeorm_1.InjectRepository)(beneficiary_entity_js_1.Beneficiary)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        users_service_js_1.UsersService,
        mail_service_js_1.MailService,
        audit_service_js_1.AuditService,
        alerts_service_js_1.AlertsService,
        indicators_service_js_1.IndicatorsService])
], SubmissionsService);
function ageBandBucket(beneficiary) {
    if (beneficiary.age_band)
        return [beneficiary.age_band];
    const age = (0, derive_cohorts_js_1.ageFromDob)(beneficiary.date_of_birth);
    if (age === null)
        return null;
    if (age < 18)
        return ['under_18'];
    if (age <= 24)
        return ['18_24'];
    if (age <= 34)
        return ['25_34'];
    return ['35_plus'];
}
//# sourceMappingURL=submissions.service.js.map