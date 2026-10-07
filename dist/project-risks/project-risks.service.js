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
exports.ProjectRisksService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const project_risk_entity_js_1 = require("./project-risk.entity.js");
const audit_service_js_1 = require("../audit/audit.service.js");
let ProjectRisksService = class ProjectRisksService {
    repo;
    auditService;
    constructor(repo, auditService) {
        this.repo = repo;
        this.auditService = auditService;
    }
    async findAll(filters = {}) {
        const where = filters.include_resolved ? {} : { resolved_at: (0, typeorm_2.IsNull)() };
        return this.repo.find({
            where,
            order: { resolved_at: 'ASC', deadline: 'ASC', created_at: 'DESC' },
        });
    }
    async create(dto, actorId, actorName) {
        const entity = this.repo.create({
            key_issue: dto.key_issue,
            corrective_action: dto.corrective_action ?? '',
            responsibility: dto.responsibility ?? '',
            deadline: dto.deadline ? new Date(dto.deadline) : null,
            status: dto.status ?? 'pending_initiation',
            comments: dto.comments ?? '',
        });
        const saved = await this.repo.save(entity);
        void this.auditService.log({
            user_id: actorId,
            user_name: actorName,
            action: 'create',
            resource: 'project_risk',
            resource_id: saved.id,
            after_data: this.snapshot(saved),
        });
        return saved;
    }
    async update(id, dto, actorId, actorName) {
        const existing = await this.repo.findOne({ where: { id } });
        if (!existing)
            throw new common_1.NotFoundException(`Risk ${id} not found`);
        const before = this.snapshot(existing);
        existing.key_issue = dto.key_issue;
        existing.corrective_action =
            dto.corrective_action ?? existing.corrective_action;
        existing.responsibility = dto.responsibility ?? existing.responsibility;
        existing.deadline = dto.deadline
            ? new Date(dto.deadline)
            : existing.deadline;
        existing.status = dto.status ?? existing.status;
        existing.comments = dto.comments ?? existing.comments;
        const saved = await this.repo.save(existing);
        void this.auditService.log({
            user_id: actorId,
            user_name: actorName,
            action: 'update',
            resource: 'project_risk',
            resource_id: saved.id,
            before_data: before,
            after_data: this.snapshot(saved),
        });
        return saved;
    }
    async resolve(id, actorId, actorName) {
        const existing = await this.repo.findOne({ where: { id } });
        if (!existing)
            throw new common_1.NotFoundException(`Risk ${id} not found`);
        existing.resolved_at = new Date();
        existing.status = 'finalized';
        const saved = await this.repo.save(existing);
        void this.auditService.log({
            user_id: actorId,
            user_name: actorName,
            action: 'update',
            resource: 'project_risk',
            resource_id: saved.id,
            after_data: { resolved_at: saved.resolved_at, status: saved.status },
        });
        return saved;
    }
    snapshot(row) {
        return {
            id: row.id,
            key_issue: row.key_issue,
            corrective_action: row.corrective_action,
            responsibility: row.responsibility,
            deadline: row.deadline,
            status: row.status,
            comments: row.comments,
            resolved_at: row.resolved_at,
        };
    }
};
exports.ProjectRisksService = ProjectRisksService;
exports.ProjectRisksService = ProjectRisksService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(project_risk_entity_js_1.ProjectRisk)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        audit_service_js_1.AuditService])
], ProjectRisksService);
//# sourceMappingURL=project-risks.service.js.map