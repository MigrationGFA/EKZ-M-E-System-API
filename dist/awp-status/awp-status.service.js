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
exports.AwpStatusService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const activity_quarterly_status_entity_js_1 = require("./activity-quarterly-status.entity.js");
const logframe_node_entity_js_1 = require("../logframe/logframe-node.entity.js");
const audit_service_js_1 = require("../audit/audit.service.js");
let AwpStatusService = class AwpStatusService {
    repo;
    nodeRepo;
    auditService;
    constructor(repo, nodeRepo, auditService) {
        this.repo = repo;
        this.nodeRepo = nodeRepo;
        this.auditService = auditService;
    }
    async findByPeriod(year, quarter) {
        return this.repo.find({
            where: { year, quarter },
            order: { created_at: 'ASC' },
        });
    }
    async upsert(nodeId, year, quarter, dto, actorId, actorName) {
        if (quarter < 1 || quarter > 4) {
            throw new common_1.UnprocessableEntityException(`quarter must be between 1 and 4 (got ${quarter})`);
        }
        const node = await this.nodeRepo.findOne({ where: { id: nodeId } });
        if (!node) {
            throw new common_1.NotFoundException(`Logframe node ${nodeId} not found`);
        }
        if (node.type !== 'activity') {
            throw new common_1.UnprocessableEntityException(`Logframe node ${nodeId} has type "${node.type}"; AWP status rows are only allowed against activity nodes`);
        }
        const existing = await this.repo.findOne({
            where: { logframe_node_id: nodeId, year, quarter },
        });
        if (existing) {
            const before = this.snapshot(existing);
            existing.status = dto.status ?? existing.status;
            existing.pct_achievement =
                dto.pct_achievement ?? existing.pct_achievement;
            existing.comments = dto.comments ?? existing.comments;
            existing.planned_for_next_qtr =
                dto.planned_for_next_qtr ?? existing.planned_for_next_qtr;
            existing.deadline = dto.deadline
                ? new Date(dto.deadline)
                : existing.deadline;
            const saved = await this.repo.save(existing);
            void this.auditService.log({
                user_id: actorId,
                user_name: actorName,
                action: 'update',
                resource: 'activity_quarterly_status',
                resource_id: saved.id,
                before_data: before,
                after_data: this.snapshot(saved),
            });
            return saved;
        }
        const fresh = this.repo.create({
            logframe_node_id: nodeId,
            year,
            quarter,
            status: dto.status ?? 'pending_initiation',
            pct_achievement: dto.pct_achievement ?? 0,
            comments: dto.comments ?? '',
            planned_for_next_qtr: dto.planned_for_next_qtr ?? false,
            deadline: dto.deadline ? new Date(dto.deadline) : null,
        });
        const saved = await this.repo.save(fresh);
        void this.auditService.log({
            user_id: actorId,
            user_name: actorName,
            action: 'create',
            resource: 'activity_quarterly_status',
            resource_id: saved.id,
            after_data: this.snapshot(saved),
        });
        return saved;
    }
    snapshot(row) {
        return {
            id: row.id,
            logframe_node_id: row.logframe_node_id,
            year: row.year,
            quarter: row.quarter,
            status: row.status,
            pct_achievement: row.pct_achievement,
            comments: row.comments,
            planned_for_next_qtr: row.planned_for_next_qtr,
            deadline: row.deadline,
        };
    }
};
exports.AwpStatusService = AwpStatusService;
exports.AwpStatusService = AwpStatusService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(activity_quarterly_status_entity_js_1.ActivityQuarterlyStatus)),
    __param(1, (0, typeorm_1.InjectRepository)(logframe_node_entity_js_1.LogframeNode)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        audit_service_js_1.AuditService])
], AwpStatusService);
//# sourceMappingURL=awp-status.service.js.map