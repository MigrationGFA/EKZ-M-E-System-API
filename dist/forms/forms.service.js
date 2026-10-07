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
exports.FormsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const form_entity_js_1 = require("./form.entity.js");
const submission_entity_js_1 = require("../submissions/submission.entity.js");
const indicator_entity_js_1 = require("../indicators/indicator.entity.js");
const data_source_js_1 = require("../indicators/constants/data-source.js");
const audit_service_js_1 = require("../audit/audit.service.js");
const alerts_service_js_1 = require("../alerts/alerts.service.js");
const users_service_js_1 = require("../users/users.service.js");
const mail_service_js_1 = require("../mail/mail.service.js");
let FormsService = class FormsService {
    formRepo;
    subRepo;
    indicatorRepo;
    auditService;
    alertsService;
    usersService;
    mailService;
    constructor(formRepo, subRepo, indicatorRepo, auditService, alertsService, usersService, mailService) {
        this.formRepo = formRepo;
        this.subRepo = subRepo;
        this.indicatorRepo = indicatorRepo;
        this.auditService = auditService;
        this.alertsService = alertsService;
        this.usersService = usersService;
        this.mailService = mailService;
    }
    async assertMappingsAllowed(field_mappings) {
        if (!field_mappings?.length)
            return;
        const ids = Array.from(new Set(field_mappings.map((m) => m.indicator_id).filter(Boolean)));
        if (!ids.length)
            return;
        const indicators = await this.indicatorRepo.find({
            where: { id: (0, typeorm_2.In)(ids) },
            select: ['id', 'data_source_type'],
        });
        const offenders = indicators.filter((i) => !(0, data_source_js_1.isMappableDataSourceType)(i.data_source_type));
        if (offenders.length === 0)
            return;
        const first = offenders[0];
        throw new common_1.UnprocessableEntityException({
            message: `Indicator ${first.id} has data_source_type '${first.data_source_type}' and cannot be auto-populated from a form mapping.`,
            code: 'EXTERNAL_INDICATOR_NOT_MAPPABLE',
            indicator_id: first.id,
            data_source_type: first.data_source_type,
        });
    }
    async findAll(filters) {
        const qb = this.formRepo.createQueryBuilder('f');
        if (filters.status) {
            qb.andWhere('f.status = :status', { status: filters.status });
        }
        if (filters.assigned_to) {
            qb.andWhere(':userId = ANY(f.assigned_to)', {
                userId: filters.assigned_to,
            });
        }
        qb.orderBy('f.created_at', 'DESC');
        const forms = await qb.getMany();
        return forms.map((f) => this.serialize(f));
    }
    async findOne(id) {
        const form = await this.formRepo.findOne({ where: { id } });
        if (!form)
            throw new common_1.NotFoundException('Form not found');
        return this.serialize(form);
    }
    async create(dto, actorId, actorName) {
        await this.assertMappingsAllowed(dto.field_mappings);
        const form = this.formRepo.create({
            title: dto.title,
            description: dto.description ?? '',
            fields: dto.fields ?? [],
            indicator_ids: dto.indicator_ids ?? [],
            assigned_to: dto.assigned_to ?? [],
            field_mappings: dto.field_mappings ?? [],
            location_ids: dto.location_ids ?? [],
            require_gps: dto.require_gps ?? false,
            created_by: dto.created_by,
            status: dto.status ?? 'draft',
        });
        const saved = await this.formRepo.save(form);
        const result = this.serialize(saved);
        await this.notifyNewAssignees(dto.assigned_to ?? [], saved.title);
        void this.auditService.log({
            user_id: actorId,
            user_name: actorName,
            action: 'create',
            resource: 'form',
            resource_id: saved.id,
            after_data: result,
        });
        return result;
    }
    async update(id, dto, actorId, actorName) {
        const form = await this.formRepo.findOne({ where: { id } });
        if (!form)
            throw new common_1.NotFoundException('Form not found');
        if (dto.field_mappings !== undefined) {
            await this.assertMappingsAllowed(dto.field_mappings);
        }
        const beforeData = this.serialize(form);
        const updates = Object.fromEntries(Object.entries(dto).filter(([, v]) => v !== undefined));
        Object.assign(form, updates);
        const saved = await this.formRepo.save(form);
        const afterData = this.serialize(saved);
        const oldAssigned = beforeData.assigned_to ?? [];
        const newAssigned = dto.assigned_to;
        if (newAssigned !== undefined) {
            const newlyAddedIds = newAssigned.filter((id) => !oldAssigned.includes(id));
            await this.notifyNewAssignees(newlyAddedIds, saved.title);
        }
        void this.auditService.log({
            user_id: actorId,
            user_name: actorName,
            action: 'update',
            resource: 'form',
            resource_id: saved.id,
            before_data: beforeData,
            after_data: afterData,
        });
        return afterData;
    }
    async remove(id, actorId, actorName) {
        const form = await this.formRepo.findOne({ where: { id } });
        if (!form)
            throw new common_1.NotFoundException('Form not found');
        const submissionCount = await this.subRepo.count({
            where: { form_id: id },
        });
        if (submissionCount > 0) {
            throw new common_1.ConflictException(`Cannot delete form with ${submissionCount} existing submission(s). Remove or reassign submissions first.`);
        }
        const beforeData = this.serialize(form);
        await this.formRepo.remove(form);
        void this.auditService.log({
            user_id: actorId,
            user_name: actorName,
            action: 'delete',
            resource: 'form',
            resource_id: id,
            before_data: beforeData,
        });
    }
    async notifyNewAssignees(userIds, formTitle) {
        for (const userId of userIds) {
            const user = await this.usersService.findById(userId);
            if (!user)
                continue;
            void this.alertsService.create({
                user_id: user.id,
                user_email: user.email,
                title: 'Form Assigned',
                description: `You have been assigned the form "${formTitle}". Open Data Entry to submit.`,
                type: 'form_assigned',
                sendEmail: false,
            });
            void this.mailService.sendFormAssigned(user.email, user.name, formTitle);
        }
    }
    serialize(f) {
        return {
            id: f.id,
            title: f.title,
            description: f.description,
            fields: f.fields,
            indicator_ids: f.indicator_ids,
            assigned_to: f.assigned_to,
            field_mappings: f.field_mappings ?? [],
            location_ids: f.location_ids ?? [],
            require_gps: f.require_gps ?? false,
            created_by: f.created_by,
            status: f.status,
            createdAt: f.created_at,
        };
    }
};
exports.FormsService = FormsService;
exports.FormsService = FormsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(form_entity_js_1.Form)),
    __param(1, (0, typeorm_1.InjectRepository)(submission_entity_js_1.Submission)),
    __param(2, (0, typeorm_1.InjectRepository)(indicator_entity_js_1.Indicator)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        audit_service_js_1.AuditService,
        alerts_service_js_1.AlertsService,
        users_service_js_1.UsersService,
        mail_service_js_1.MailService])
], FormsService);
//# sourceMappingURL=forms.service.js.map