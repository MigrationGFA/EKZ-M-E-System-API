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
var DisaggregationService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.DisaggregationService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const indicator_entity_js_1 = require("./indicator.entity.js");
const indicator_disaggregation_entity_js_1 = require("./indicator-disaggregation.entity.js");
const indicator_progress_breakdown_entity_js_1 = require("./indicator-progress-breakdown.entity.js");
const disaggregation_dto_js_1 = require("./dto/disaggregation.dto.js");
const audit_service_js_1 = require("../audit/audit.service.js");
const RATIO_AXES = new Set([
    disaggregation_dto_js_1.DisaggregationAxis.SEX,
    disaggregation_dto_js_1.DisaggregationAxis.AGE_BAND,
    disaggregation_dto_js_1.DisaggregationAxis.SKILL_LEVEL,
]);
let DisaggregationService = DisaggregationService_1 = class DisaggregationService {
    indicatorRepo;
    rulesRepo;
    breakdownsRepo;
    dataSource;
    auditService;
    logger = new common_1.Logger(DisaggregationService_1.name);
    constructor(indicatorRepo, rulesRepo, breakdownsRepo, dataSource, auditService) {
        this.indicatorRepo = indicatorRepo;
        this.rulesRepo = rulesRepo;
        this.breakdownsRepo = breakdownsRepo;
        this.dataSource = dataSource;
        this.auditService = auditService;
    }
    async getRules(indicatorId) {
        await this.assertIndicatorExists(indicatorId);
        return this.rulesRepo.find({
            where: { indicator_id: indicatorId },
            order: { axis: 'ASC' },
        });
    }
    async setRules(indicatorId, dto, actorId, actorName) {
        await this.assertIndicatorExists(indicatorId);
        const seenAxes = new Set();
        for (const rule of dto.rules) {
            if (seenAxes.has(rule.axis)) {
                throw new common_1.BadRequestException(`Duplicate axis '${rule.axis}' in disaggregation rules`);
            }
            seenAxes.add(rule.axis);
        }
        const before = await this.rulesRepo.find({
            where: { indicator_id: indicatorId },
            order: { axis: 'ASC' },
        });
        const saved = await this.dataSource.transaction(async (manager) => {
            const repo = manager.getRepository(indicator_disaggregation_entity_js_1.IndicatorDisaggregation);
            await repo.delete({ indicator_id: indicatorId });
            if (dto.rules.length === 0)
                return [];
            const rows = dto.rules.map((r) => repo.create({
                indicator_id: indicatorId,
                axis: r.axis,
                required: r.required ?? true,
                breakdown_target: r.breakdown_target ?? null,
                notes: r.notes ?? null,
            }));
            return repo.save(rows);
        });
        const sorted = [...saved].sort((a, b) => a.axis.localeCompare(b.axis));
        void this.auditService.log({
            user_id: actorId,
            user_name: actorName,
            action: 'update',
            resource: 'indicator_disaggregations',
            resource_id: indicatorId,
            before_data: before,
            after_data: sorted,
        });
        return sorted;
    }
    async getRollup(indicatorId, axis) {
        await this.assertIndicatorExists(indicatorId);
        const rows = await this.breakdownsRepo
            .createQueryBuilder('b')
            .innerJoin('indicator_progress', 'p', 'p.id = b.progress_id AND p.indicator_id = :indicatorId', { indicatorId })
            .where('b.axis = :axis', { axis })
            .getMany();
        const buckets = {};
        for (const row of rows) {
            for (const [bucket, value] of Object.entries(row.value_breakdown)) {
                if (typeof value !== 'number' || !Number.isFinite(value))
                    continue;
                buckets[bucket] = (buckets[bucket] ?? 0) + value;
            }
        }
        const total = Object.values(buckets).reduce((a, b) => a + b, 0);
        const rule = await this.rulesRepo.findOne({
            where: { indicator_id: indicatorId, axis },
        });
        const target = rule?.breakdown_target ?? null;
        const gap = target ? this.computeGap(axis, target, buckets, total) : null;
        return { axis, total, buckets, target, gap };
    }
    computeGap(axis, target, buckets, total) {
        const ratio = RATIO_AXES.has(axis);
        const gap = {};
        for (const [bucket, t] of Object.entries(target)) {
            const actual = buckets[bucket] ?? 0;
            if (ratio) {
                const share = total > 0 ? actual / total : 0;
                gap[bucket] = t - share;
            }
            else {
                gap[bucket] = t - actual;
            }
        }
        return gap;
    }
    async persistBreakdowns(progressId, progressValue, breakdowns) {
        if (!breakdowns.length)
            return;
        const seenAxes = new Set();
        for (const b of breakdowns) {
            if (seenAxes.has(b.axis)) {
                this.logger.warn(`Duplicate axis '${b.axis}' in breakdowns for progress ${progressId}; keeping last`);
            }
            seenAxes.add(b.axis);
            const sum = Object.values(b.value_breakdown).reduce((a, n) => a + (typeof n === 'number' ? n : 0), 0);
            if (sum > progressValue + 1e-9) {
                this.logger.warn(`Breakdown sum ${sum} exceeds progress value ${progressValue} on axis '${b.axis}' for progress ${progressId}`);
            }
        }
        const rows = breakdowns.map((b) => this.breakdownsRepo.create({
            progress_id: progressId,
            axis: b.axis,
            value_breakdown: b.value_breakdown,
        }));
        await this.breakdownsRepo.save(rows);
    }
    async assertIndicatorExists(indicatorId) {
        const exists = await this.indicatorRepo.existsBy({ id: indicatorId });
        if (!exists)
            throw new common_1.NotFoundException('Indicator not found');
    }
};
exports.DisaggregationService = DisaggregationService;
exports.DisaggregationService = DisaggregationService = DisaggregationService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(indicator_entity_js_1.Indicator)),
    __param(1, (0, typeorm_1.InjectRepository)(indicator_disaggregation_entity_js_1.IndicatorDisaggregation)),
    __param(2, (0, typeorm_1.InjectRepository)(indicator_progress_breakdown_entity_js_1.IndicatorProgressBreakdown)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.DataSource,
        audit_service_js_1.AuditService])
], DisaggregationService);
//# sourceMappingURL=disaggregation.service.js.map