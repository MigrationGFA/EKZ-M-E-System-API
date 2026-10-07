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
exports.AuditFindingsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const audit_finding_entity_js_1 = require("./audit-finding.entity.js");
const audit_service_js_1 = require("../../audit/audit.service.js");
let AuditFindingsService = class AuditFindingsService {
    repo;
    auditService;
    constructor(repo, auditService) {
        this.repo = repo;
        this.auditService = auditService;
    }
    findAll() {
        return this.repo.find({
            order: { year: 'DESC', order: 'ASC', created_at: 'ASC' },
        });
    }
    async create(dto, actorId, actorName) {
        const entity = this.repo.create({
            year: dto.year,
            audit_status: dto.audit_status ?? 'pending_initiation',
            key_issue: dto.key_issue,
            corrective_measures: dto.corrective_measures ?? '',
            comments: dto.comments ?? '',
            expected_submission_date: dto.expected_submission_date
                ? new Date(dto.expected_submission_date)
                : null,
            order: dto.order ?? 0,
        });
        const saved = await this.repo.save(entity);
        void this.auditService.log({
            user_id: actorId,
            user_name: actorName,
            action: 'create',
            resource: 'audit_finding',
            resource_id: saved.id,
            after_data: this.snapshot(saved),
        });
        return saved;
    }
    async update(id, dto, actorId, actorName) {
        const existing = await this.repo.findOne({ where: { id } });
        if (!existing)
            throw new common_1.NotFoundException(`Audit finding ${id} not found`);
        const before = this.snapshot(existing);
        existing.year = dto.year;
        existing.audit_status = dto.audit_status ?? existing.audit_status;
        existing.key_issue = dto.key_issue;
        existing.corrective_measures =
            dto.corrective_measures ?? existing.corrective_measures;
        existing.comments = dto.comments ?? existing.comments;
        existing.expected_submission_date = dto.expected_submission_date
            ? new Date(dto.expected_submission_date)
            : existing.expected_submission_date;
        existing.order = dto.order ?? existing.order;
        const saved = await this.repo.save(existing);
        void this.auditService.log({
            user_id: actorId,
            user_name: actorName,
            action: 'update',
            resource: 'audit_finding',
            resource_id: saved.id,
            before_data: before,
            after_data: this.snapshot(saved),
        });
        return saved;
    }
    async remove(id, actorId, actorName) {
        const existing = await this.repo.findOne({ where: { id } });
        if (!existing)
            throw new common_1.NotFoundException(`Audit finding ${id} not found`);
        await this.repo.remove(existing);
        void this.auditService.log({
            user_id: actorId,
            user_name: actorName,
            action: 'delete',
            resource: 'audit_finding',
            resource_id: id,
            before_data: this.snapshot(existing),
        });
    }
    snapshot(row) {
        return {
            id: row.id,
            year: row.year,
            audit_status: row.audit_status,
            key_issue: row.key_issue,
            corrective_measures: row.corrective_measures,
            comments: row.comments,
            expected_submission_date: row.expected_submission_date,
            order: row.order,
        };
    }
};
exports.AuditFindingsService = AuditFindingsService;
exports.AuditFindingsService = AuditFindingsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(audit_finding_entity_js_1.AuditFinding)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        audit_service_js_1.AuditService])
], AuditFindingsService);
//# sourceMappingURL=audit-findings.service.js.map