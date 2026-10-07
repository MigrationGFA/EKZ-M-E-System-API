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
exports.SafeguardsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const safeguard_measure_entity_js_1 = require("./safeguard-measure.entity.js");
const audit_service_js_1 = require("../../audit/audit.service.js");
let SafeguardsService = class SafeguardsService {
    repo;
    auditService;
    constructor(repo, auditService) {
        this.repo = repo;
        this.auditService = auditService;
    }
    findAll() {
        return this.repo.find({ order: { order: 'ASC', type: 'ASC' } });
    }
    async create(dto, actorId, actorName) {
        const entity = this.repo.create({
            type: dto.type,
            measure_name: dto.measure_name,
            total_count: dto.total_count ?? 0,
            not_started_count: dto.not_started_count ?? 0,
            ongoing_count: dto.ongoing_count ?? 0,
            completed_count: dto.completed_count ?? 0,
            budget_allocated_ua: dto.budget_allocated_ua ?? 0,
            amount_disbursed_ua: dto.amount_disbursed_ua ?? 0,
            order: dto.order ?? 0,
        });
        const saved = await this.repo.save(entity);
        void this.auditService.log({
            user_id: actorId,
            user_name: actorName,
            action: 'create',
            resource: 'safeguard_measure',
            resource_id: saved.id,
            after_data: this.snapshot(saved),
        });
        return saved;
    }
    async update(id, dto, actorId, actorName) {
        const existing = await this.repo.findOne({ where: { id } });
        if (!existing)
            throw new common_1.NotFoundException(`Safeguard ${id} not found`);
        const before = this.snapshot(existing);
        existing.type = dto.type;
        existing.measure_name = dto.measure_name;
        existing.total_count = dto.total_count ?? existing.total_count;
        existing.not_started_count =
            dto.not_started_count ?? existing.not_started_count;
        existing.ongoing_count = dto.ongoing_count ?? existing.ongoing_count;
        existing.completed_count = dto.completed_count ?? existing.completed_count;
        existing.budget_allocated_ua =
            dto.budget_allocated_ua ?? existing.budget_allocated_ua;
        existing.amount_disbursed_ua =
            dto.amount_disbursed_ua ?? existing.amount_disbursed_ua;
        existing.order = dto.order ?? existing.order;
        const saved = await this.repo.save(existing);
        void this.auditService.log({
            user_id: actorId,
            user_name: actorName,
            action: 'update',
            resource: 'safeguard_measure',
            resource_id: saved.id,
            before_data: before,
            after_data: this.snapshot(saved),
        });
        return saved;
    }
    async remove(id, actorId, actorName) {
        const existing = await this.repo.findOne({ where: { id } });
        if (!existing)
            throw new common_1.NotFoundException(`Safeguard ${id} not found`);
        await this.repo.remove(existing);
        void this.auditService.log({
            user_id: actorId,
            user_name: actorName,
            action: 'delete',
            resource: 'safeguard_measure',
            resource_id: id,
            before_data: this.snapshot(existing),
        });
    }
    snapshot(row) {
        return {
            id: row.id,
            type: row.type,
            measure_name: row.measure_name,
            total_count: row.total_count,
            not_started_count: row.not_started_count,
            ongoing_count: row.ongoing_count,
            completed_count: row.completed_count,
            budget_allocated_ua: row.budget_allocated_ua,
            amount_disbursed_ua: row.amount_disbursed_ua,
            order: row.order,
        };
    }
};
exports.SafeguardsService = SafeguardsService;
exports.SafeguardsService = SafeguardsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(safeguard_measure_entity_js_1.SafeguardMeasure)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        audit_service_js_1.AuditService])
], SafeguardsService);
//# sourceMappingURL=safeguards.service.js.map