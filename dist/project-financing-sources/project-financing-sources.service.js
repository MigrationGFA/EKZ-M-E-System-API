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
exports.ProjectFinancingSourcesService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const project_financing_source_entity_js_1 = require("./project-financing-source.entity.js");
const project_meta_entity_js_1 = require("../project-meta/project-meta.entity.js");
const audit_service_js_1 = require("../audit/audit.service.js");
let ProjectFinancingSourcesService = class ProjectFinancingSourcesService {
    repo;
    metaRepo;
    auditService;
    constructor(repo, metaRepo, auditService) {
        this.repo = repo;
        this.metaRepo = metaRepo;
        this.auditService = auditService;
    }
    async findAll() {
        return this.repo.find({ order: { order: 'ASC', source_name: 'ASC' } });
    }
    async create(dto, actorId, actorName) {
        const meta = await this.metaRepo.findOne({ where: {} });
        if (!meta) {
            throw new common_1.UnprocessableEntityException('project_meta must be initialised before financing sources can be added');
        }
        const entity = this.repo.create({
            project_meta_id: meta.id,
            source_name: dto.source_name,
            instrument: dto.instrument,
            total_approved_ua: dto.total_approved_ua,
            disbursed_ua: dto.disbursed_ua ?? 0,
            order: dto.order ?? 0,
        });
        const saved = await this.repo.save(entity);
        void this.auditService.log({
            user_id: actorId,
            user_name: actorName,
            action: 'create',
            resource: 'project_financing_source',
            resource_id: saved.id,
            after_data: this.snapshot(saved),
        });
        return saved;
    }
    async update(id, dto, actorId, actorName) {
        const existing = await this.repo.findOne({ where: { id } });
        if (!existing) {
            throw new common_1.NotFoundException(`Financing source ${id} not found`);
        }
        const before = this.snapshot(existing);
        existing.source_name = dto.source_name;
        existing.instrument = dto.instrument;
        existing.total_approved_ua = dto.total_approved_ua;
        existing.disbursed_ua = dto.disbursed_ua ?? 0;
        existing.order = dto.order ?? existing.order;
        const saved = await this.repo.save(existing);
        void this.auditService.log({
            user_id: actorId,
            user_name: actorName,
            action: 'update',
            resource: 'project_financing_source',
            resource_id: saved.id,
            before_data: before,
            after_data: this.snapshot(saved),
        });
        return saved;
    }
    async remove(id, actorId, actorName) {
        const existing = await this.repo.findOne({ where: { id } });
        if (!existing) {
            throw new common_1.NotFoundException(`Financing source ${id} not found`);
        }
        await this.repo.remove(existing);
        void this.auditService.log({
            user_id: actorId,
            user_name: actorName,
            action: 'delete',
            resource: 'project_financing_source',
            resource_id: id,
            before_data: this.snapshot(existing),
        });
    }
    snapshot(row) {
        return {
            id: row.id,
            source_name: row.source_name,
            instrument: row.instrument,
            total_approved_ua: row.total_approved_ua,
            disbursed_ua: row.disbursed_ua,
            order: row.order,
        };
    }
};
exports.ProjectFinancingSourcesService = ProjectFinancingSourcesService;
exports.ProjectFinancingSourcesService = ProjectFinancingSourcesService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(project_financing_source_entity_js_1.ProjectFinancingSource)),
    __param(1, (0, typeorm_1.InjectRepository)(project_meta_entity_js_1.ProjectMeta)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        audit_service_js_1.AuditService])
], ProjectFinancingSourcesService);
//# sourceMappingURL=project-financing-sources.service.js.map