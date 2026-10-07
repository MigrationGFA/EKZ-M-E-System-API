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
exports.ProjectMetaService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const project_meta_entity_js_1 = require("./project-meta.entity.js");
const logframe_node_entity_js_1 = require("../logframe/logframe-node.entity.js");
const audit_service_js_1 = require("../audit/audit.service.js");
let ProjectMetaService = class ProjectMetaService {
    metaRepo;
    nodeRepo;
    auditService;
    constructor(metaRepo, nodeRepo, auditService) {
        this.metaRepo = metaRepo;
        this.nodeRepo = nodeRepo;
        this.auditService = auditService;
    }
    async get() {
        const meta = await this.metaRepo.findOne({ where: {} });
        if (!meta) {
            throw new common_1.NotFoundException('Project metadata has not been initialised yet');
        }
        return meta;
    }
    async upsert(dto, actorId, actorName) {
        if (dto.completion_year <= dto.baseline_year) {
            throw new common_1.BadRequestException('completion_year must be greater than baseline_year');
        }
        if (dto.pdo_node_id) {
            const node = await this.nodeRepo.findOne({
                where: { id: dto.pdo_node_id },
            });
            if (!node) {
                throw new common_1.UnprocessableEntityException(`Logframe node ${dto.pdo_node_id} does not exist`);
            }
            if (node.type !== 'pdo') {
                throw new common_1.UnprocessableEntityException(`Logframe node ${dto.pdo_node_id} is type "${node.type}"; pdo_node_id must reference a node of type "pdo"`);
            }
        }
        const existing = await this.metaRepo.findOne({ where: {} });
        if (existing) {
            const beforeData = this.snapshot(existing);
            Object.assign(existing, this.dtoToPersist(dto));
            const saved = await this.metaRepo.save(existing);
            void this.auditService.log({
                user_id: actorId,
                user_name: actorName,
                action: 'update',
                resource: 'project_meta',
                resource_id: saved.id,
                before_data: beforeData,
                after_data: this.snapshot(saved),
            });
            return saved;
        }
        const created = this.metaRepo.create(this.dtoToPersist(dto));
        const saved = await this.metaRepo.save(created);
        void this.auditService.log({
            user_id: actorId,
            user_name: actorName,
            action: 'create',
            resource: 'project_meta',
            resource_id: saved.id,
            after_data: this.snapshot(saved),
        });
        return saved;
    }
    dtoToPersist(dto) {
        return {
            name: dto.name,
            sap_code: dto.sap_code ?? null,
            pdo_text: dto.pdo_text,
            baseline_year: dto.baseline_year,
            completion_year: dto.completion_year,
            midpoint_date: dto.midpoint_date ? new Date(dto.midpoint_date) : null,
            pdo_node_id: dto.pdo_node_id ?? null,
            sector: dto.sector ?? null,
            country: dto.country ?? 'Nigeria',
            executing_agency: dto.executing_agency ?? null,
            responsible_project_staff: dto.responsible_project_staff ?? null,
            original_disbursement_deadline: dto.original_disbursement_deadline
                ? new Date(dto.original_disbursement_deadline)
                : null,
            revised_disbursement_deadline: dto.revised_disbursement_deadline
                ? new Date(dto.revised_disbursement_deadline)
                : null,
        };
    }
    snapshot(meta) {
        return {
            id: meta.id,
            name: meta.name,
            sap_code: meta.sap_code,
            pdo_text: meta.pdo_text,
            baseline_year: meta.baseline_year,
            completion_year: meta.completion_year,
            midpoint_date: meta.midpoint_date,
            pdo_node_id: meta.pdo_node_id,
            sector: meta.sector,
            country: meta.country,
            executing_agency: meta.executing_agency,
            responsible_project_staff: meta.responsible_project_staff,
            original_disbursement_deadline: meta.original_disbursement_deadline,
            revised_disbursement_deadline: meta.revised_disbursement_deadline,
        };
    }
};
exports.ProjectMetaService = ProjectMetaService;
exports.ProjectMetaService = ProjectMetaService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(project_meta_entity_js_1.ProjectMeta)),
    __param(1, (0, typeorm_1.InjectRepository)(logframe_node_entity_js_1.LogframeNode)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        audit_service_js_1.AuditService])
], ProjectMetaService);
//# sourceMappingURL=project-meta.service.js.map