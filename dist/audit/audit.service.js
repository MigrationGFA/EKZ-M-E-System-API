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
exports.AuditService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const audit_entry_entity_js_1 = require("./audit-entry.entity.js");
let AuditService = class AuditService {
    auditRepo;
    constructor(auditRepo) {
        this.auditRepo = auditRepo;
    }
    async findAll(filters) {
        const qb = this.auditRepo.createQueryBuilder('a');
        if (filters.user_id) {
            qb.andWhere('a.user_id = :userId', { userId: filters.user_id });
        }
        if (filters.action) {
            qb.andWhere('a.action = :action', { action: filters.action });
        }
        if (filters.resource) {
            qb.andWhere('a.resource = :resource', { resource: filters.resource });
        }
        if (filters.resource_id) {
            qb.andWhere('a.resource_id = :resourceId', {
                resourceId: filters.resource_id,
            });
        }
        if (filters.from) {
            qb.andWhere('a.created_at >= :from', { from: filters.from });
        }
        if (filters.to) {
            qb.andWhere('a.created_at <= :to', { to: filters.to });
        }
        const total = await qb.getCount();
        if (filters.page && filters.per_page) {
            qb.skip((filters.page - 1) * filters.per_page).take(filters.per_page);
        }
        qb.orderBy('a.created_at', 'DESC');
        const entries = await qb.getMany();
        return {
            data: entries.map((e) => this.serialize(e)),
            total,
            page: filters.page ?? 1,
            per_page: filters.per_page ?? total,
        };
    }
    async create(input) {
        const entry = this.auditRepo.create({
            user_id: input.user_id,
            user_name: input.user_name,
            action: input.action,
            resource: input.resource,
            resource_id: input.resource_id,
            before_data: input.before_data ?? null,
            after_data: input.after_data ?? null,
        });
        const saved = await this.auditRepo.save(entry);
        return this.serialize(saved);
    }
    async log(input) {
        await this.create(input);
    }
    serialize(e) {
        return {
            id: e.id,
            user_id: e.user_id,
            user_name: e.user_name,
            action: e.action,
            resource: e.resource,
            resource_id: e.resource_id,
            before: e.before_data,
            after: e.after_data,
            timestamp: e.created_at,
        };
    }
};
exports.AuditService = AuditService;
exports.AuditService = AuditService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(audit_entry_entity_js_1.AuditEntry)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], AuditService);
//# sourceMappingURL=audit.service.js.map