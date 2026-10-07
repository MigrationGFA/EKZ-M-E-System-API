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
exports.CovenantsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const project_covenant_entity_js_1 = require("./project-covenant.entity.js");
const audit_service_js_1 = require("../../audit/audit.service.js");
let CovenantsService = class CovenantsService {
    repo;
    auditService;
    constructor(repo, auditService) {
        this.repo = repo;
        this.auditService = auditService;
    }
    findAll() {
        return this.repo.find({ order: { order: 'ASC', created_at: 'ASC' } });
    }
    async create(dto, actorId, actorName) {
        const entity = this.repo.create({
            covenant_text: dto.covenant_text,
            type: dto.type,
            status: dto.status ?? 'pending_initiation',
            comments: dto.comments ?? '',
            order: dto.order ?? 0,
        });
        const saved = await this.repo.save(entity);
        void this.auditService.log({
            user_id: actorId,
            user_name: actorName,
            action: 'create',
            resource: 'project_covenant',
            resource_id: saved.id,
            after_data: this.snapshot(saved),
        });
        return saved;
    }
    async update(id, dto, actorId, actorName) {
        const existing = await this.repo.findOne({ where: { id } });
        if (!existing)
            throw new common_1.NotFoundException(`Covenant ${id} not found`);
        const before = this.snapshot(existing);
        existing.covenant_text = dto.covenant_text;
        existing.type = dto.type;
        existing.status = dto.status ?? existing.status;
        existing.comments = dto.comments ?? existing.comments;
        existing.order = dto.order ?? existing.order;
        const saved = await this.repo.save(existing);
        void this.auditService.log({
            user_id: actorId,
            user_name: actorName,
            action: 'update',
            resource: 'project_covenant',
            resource_id: saved.id,
            before_data: before,
            after_data: this.snapshot(saved),
        });
        return saved;
    }
    async remove(id, actorId, actorName) {
        const existing = await this.repo.findOne({ where: { id } });
        if (!existing)
            throw new common_1.NotFoundException(`Covenant ${id} not found`);
        await this.repo.remove(existing);
        void this.auditService.log({
            user_id: actorId,
            user_name: actorName,
            action: 'delete',
            resource: 'project_covenant',
            resource_id: id,
            before_data: this.snapshot(existing),
        });
    }
    snapshot(row) {
        return {
            id: row.id,
            covenant_text: row.covenant_text,
            type: row.type,
            status: row.status,
            comments: row.comments,
            order: row.order,
        };
    }
};
exports.CovenantsService = CovenantsService;
exports.CovenantsService = CovenantsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(project_covenant_entity_js_1.ProjectCovenant)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        audit_service_js_1.AuditService])
], CovenantsService);
//# sourceMappingURL=covenants.service.js.map