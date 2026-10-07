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
exports.LogframeService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const logframe_node_entity_js_1 = require("./logframe-node.entity.js");
const indicator_entity_js_1 = require("../indicators/indicator.entity.js");
const audit_service_js_1 = require("../audit/audit.service.js");
const PARENT_TYPE_MAP = {
    pdo: null,
    alignment: ['pdo'],
    component: ['pdo'],
    outcome_statement: ['pdo'],
    output_statement: ['component'],
    goal: null,
    outcome: ['goal', 'pdo'],
    output: ['outcome', 'output_statement'],
    activity: ['output', 'output_statement'],
};
const SINGLETON_TYPES = new Set(['pdo']);
let LogframeService = class LogframeService {
    nodeRepo;
    indicatorRepo;
    auditService;
    constructor(nodeRepo, indicatorRepo, auditService) {
        this.nodeRepo = nodeRepo;
        this.indicatorRepo = indicatorRepo;
        this.auditService = auditService;
    }
    async getTree() {
        const nodes = await this.nodeRepo.find({ order: { order: 'ASC' } });
        const indicators = await this.indicatorRepo.find();
        const indicatorsByNode = new Map();
        for (const ind of indicators) {
            if (ind.logframe_level_id) {
                if (!indicatorsByNode.has(ind.logframe_level_id)) {
                    indicatorsByNode.set(ind.logframe_level_id, []);
                }
                indicatorsByNode
                    .get(ind.logframe_level_id)
                    .push(this.serializeIndicator(ind));
            }
        }
        const nodeMap = new Map();
        for (const node of nodes) {
            nodeMap.set(node.id, {
                id: node.id,
                logframe_id: node.logframe_id,
                type: node.type,
                code: node.code,
                title: node.title,
                description: node.description,
                parent_id: node.parent_id,
                order: node.order,
                budget_usd: node.budget_usd,
                budget_currency: node.budget_currency,
                indicators: indicatorsByNode.get(node.id) ?? [],
                children: [],
            });
        }
        const roots = [];
        for (const node of nodeMap.values()) {
            if (node.parent_id && nodeMap.has(node.parent_id)) {
                nodeMap.get(node.parent_id).children.push(node);
            }
            else if (!node.parent_id) {
                roots.push(node);
            }
        }
        return roots;
    }
    async createNode(dto, actorId, actorName) {
        await this.validateParentConstraint(dto.type, dto.parent_id ?? null);
        if (SINGLETON_TYPES.has(dto.type)) {
            await this.validateAtMostOneOfType(dto.type);
        }
        const node = this.nodeRepo.create({
            type: dto.type,
            code: dto.code,
            title: dto.title,
            description: dto.description ?? null,
            parent_id: dto.parent_id ?? null,
            order: dto.order ?? 0,
            budget_usd: dto.budget_usd ?? null,
            budget_currency: dto.budget_currency ?? 'USD',
        });
        const saved = await this.nodeRepo.save(node);
        const result = {
            ...saved,
            indicators: [],
            children: [],
        };
        void this.auditService.log({
            user_id: actorId,
            user_name: actorName,
            action: 'create',
            resource: 'logframe_node',
            resource_id: saved.id,
            after_data: {
                id: saved.id,
                type: saved.type,
                code: saved.code,
                title: saved.title,
                parent_id: saved.parent_id,
                budget_usd: saved.budget_usd,
                budget_currency: saved.budget_currency,
            },
        });
        return result;
    }
    async updateNode(id, dto, actorId, actorName) {
        const node = await this.nodeRepo.findOne({ where: { id } });
        if (!node)
            throw new common_1.NotFoundException('Node not found');
        const beforeData = {
            id: node.id,
            type: node.type,
            code: node.code,
            title: node.title,
            description: node.description,
            parent_id: node.parent_id,
            order: node.order,
            budget_usd: node.budget_usd,
            budget_currency: node.budget_currency,
        };
        const newType = dto.type ?? node.type;
        const newParentId = dto.parent_id !== undefined ? dto.parent_id : node.parent_id;
        await this.validateParentConstraint(newType, newParentId ?? null);
        if (SINGLETON_TYPES.has(newType) && newType !== node.type) {
            await this.validateAtMostOneOfType(newType, id);
        }
        const updates = Object.fromEntries(Object.entries(dto).filter(([, v]) => v !== undefined));
        Object.assign(node, updates);
        const saved = await this.nodeRepo.save(node);
        const indicators = await this.indicatorRepo.find({
            where: { logframe_level_id: saved.id },
        });
        const afterData = {
            id: saved.id,
            type: saved.type,
            code: saved.code,
            title: saved.title,
            description: saved.description,
            parent_id: saved.parent_id,
            order: saved.order,
            budget_usd: saved.budget_usd,
            budget_currency: saved.budget_currency,
        };
        void this.auditService.log({
            user_id: actorId,
            user_name: actorName,
            action: 'update',
            resource: 'logframe_node',
            resource_id: saved.id,
            before_data: beforeData,
            after_data: afterData,
        });
        return {
            ...saved,
            indicators: indicators.map((i) => this.serializeIndicator(i)),
            children: [],
        };
    }
    async deleteNode(id, actorId, actorName) {
        const node = await this.nodeRepo.findOne({ where: { id } });
        if (!node)
            throw new common_1.NotFoundException('Node not found');
        const childCount = await this.nodeRepo.count({
            where: { parent_id: id },
        });
        if (childCount > 0) {
            throw new common_1.BadRequestException('Cannot delete node with children. Remove children first.');
        }
        const beforeData = {
            id: node.id,
            type: node.type,
            code: node.code,
            title: node.title,
            description: node.description,
            parent_id: node.parent_id,
            order: node.order,
        };
        await this.nodeRepo.remove(node);
        void this.auditService.log({
            user_id: actorId,
            user_name: actorName,
            action: 'delete',
            resource: 'logframe_node',
            resource_id: id,
            before_data: beforeData,
        });
    }
    async linkIndicator(nodeId, indicatorId, actorId, actorName) {
        const node = await this.nodeRepo.findOne({ where: { id: nodeId } });
        if (!node)
            throw new common_1.NotFoundException('Node not found');
        const indicator = await this.indicatorRepo.findOne({
            where: { id: indicatorId },
        });
        if (!indicator)
            throw new common_1.NotFoundException('Indicator not found');
        if (indicator.logframe_level_id === nodeId) {
            throw new common_1.ConflictException('Indicator already linked to this node');
        }
        indicator.logframe_level_id = nodeId;
        await this.indicatorRepo.save(indicator);
        void this.auditService.log({
            user_id: actorId,
            user_name: actorName,
            action: 'update',
            resource: 'indicator',
            resource_id: indicatorId,
            after_data: { logframe_level_id: nodeId },
        });
        return { success: true };
    }
    async unlinkIndicator(nodeId, indicatorId, actorId, actorName) {
        const indicator = await this.indicatorRepo.findOne({
            where: { id: indicatorId, logframe_level_id: nodeId },
        });
        if (!indicator)
            throw new common_1.NotFoundException('Indicator link not found');
        indicator.logframe_level_id = null;
        await this.indicatorRepo.save(indicator);
        void this.auditService.log({
            user_id: actorId,
            user_name: actorName,
            action: 'update',
            resource: 'indicator',
            resource_id: indicatorId,
            after_data: { logframe_level_id: null },
        });
    }
    async validateParentConstraint(type, parentId) {
        const allowedParents = PARENT_TYPE_MAP[type];
        if (allowedParents === undefined) {
            throw new common_1.BadRequestException(`Unknown node type "${type}"`);
        }
        if (allowedParents === null) {
            if (parentId !== null) {
                throw new common_1.BadRequestException(`A "${type}" node must not have a parent`);
            }
            return;
        }
        const parentList = allowedParents.map((t) => `"${t}"`).join(' or ');
        if (!parentId) {
            throw new common_1.BadRequestException(`A "${type}" node requires a parent of type ${parentList}`);
        }
        const parent = await this.nodeRepo.findOne({ where: { id: parentId } });
        if (!parent)
            throw new common_1.NotFoundException('Parent node not found');
        if (!allowedParents.includes(parent.type)) {
            throw new common_1.BadRequestException(`A "${type}" node requires a parent of type ${parentList}, but got "${parent.type}"`);
        }
    }
    async validateAtMostOneOfType(type, excludeId) {
        const qb = this.nodeRepo
            .createQueryBuilder('n')
            .where('n.type = :type', { type });
        if (excludeId) {
            qb.andWhere('n.id != :excludeId', { excludeId });
        }
        const count = await qb.getCount();
        if (count > 0) {
            throw new common_1.ConflictException(`Only one "${type}" node is allowed; another already exists`);
        }
    }
    serializeIndicator(ind) {
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
            logframe_level_id: ind.logframe_level_id,
            sdg_ids: ind.sdg_ids,
            responsible_party: ind.responsible_party,
            means_of_verification: ind.means_of_verification,
            createdAt: ind.created_at,
            updatedAt: ind.updated_at,
        };
    }
};
exports.LogframeService = LogframeService;
exports.LogframeService = LogframeService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(logframe_node_entity_js_1.LogframeNode)),
    __param(1, (0, typeorm_1.InjectRepository)(indicator_entity_js_1.Indicator)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        audit_service_js_1.AuditService])
], LogframeService);
//# sourceMappingURL=logframe.service.js.map