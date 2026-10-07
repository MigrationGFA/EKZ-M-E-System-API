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
exports.QuarterlyReportsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const quarterly_progress_report_entity_js_1 = require("./quarterly-progress-report.entity.js");
const audit_service_js_1 = require("../audit/audit.service.js");
let QuarterlyReportsService = class QuarterlyReportsService {
    repo;
    auditService;
    constructor(repo, auditService) {
        this.repo = repo;
        this.auditService = auditService;
    }
    async findOne(year, quarter) {
        this.assertValidQuarter(quarter);
        return this.repo.findOne({ where: { year, quarter } });
    }
    async getOrCreate(year, quarter, actorId, actorName) {
        this.assertValidQuarter(quarter);
        const existing = await this.repo.findOne({ where: { year, quarter } });
        if (existing)
            return existing;
        const fresh = this.repo.create({
            year,
            quarter,
            unanticipated_results: [],
        });
        const saved = await this.repo.save(fresh);
        void this.auditService.log({
            user_id: actorId,
            user_name: actorName,
            action: 'create',
            resource: 'quarterly_progress_report',
            resource_id: saved.id,
            after_data: this.snapshot(saved),
        });
        return saved;
    }
    async upsert(year, quarter, dto, actorId, actorName) {
        this.assertValidQuarter(quarter);
        const existing = await this.repo.findOne({ where: { year, quarter } });
        if (existing) {
            const before = this.snapshot(existing);
            this.applyDto(existing, dto);
            const saved = await this.repo.save(existing);
            void this.auditService.log({
                user_id: actorId,
                user_name: actorName,
                action: 'update',
                resource: 'quarterly_progress_report',
                resource_id: saved.id,
                before_data: before,
                after_data: this.snapshot(saved),
            });
            return saved;
        }
        const fresh = this.repo.create({
            year,
            quarter,
            unanticipated_results: [],
        });
        this.applyDto(fresh, dto);
        const saved = await this.repo.save(fresh);
        void this.auditService.log({
            user_id: actorId,
            user_name: actorName,
            action: 'create',
            resource: 'quarterly_progress_report',
            resource_id: saved.id,
            after_data: this.snapshot(saved),
        });
        return saved;
    }
    async markGenerated(year, quarter, generatedBy) {
        this.assertValidQuarter(quarter);
        const existing = await this.repo.findOne({ where: { year, quarter } });
        if (!existing) {
            throw new common_1.NotFoundException(`Quarterly report for ${year}-Q${quarter} not found`);
        }
        existing.generated_at = new Date();
        existing.generated_by = generatedBy;
        return this.repo.save(existing);
    }
    applyDto(row, dto) {
        if (dto.executive_summary !== undefined)
            row.executive_summary = dto.executive_summary;
        if (dto.pdo_assessment !== undefined)
            row.pdo_assessment = dto.pdo_assessment;
        if (dto.unanticipated_results !== undefined)
            row.unanticipated_results =
                dto.unanticipated_results;
        if (dto.bank_performance_assessment !== undefined)
            row.bank_performance_assessment = dto.bank_performance_assessment;
        if (dto.borrower_performance_assessment !== undefined)
            row.borrower_performance_assessment = dto.borrower_performance_assessment;
        if (dto.cofinancier_performance_assessment !== undefined)
            row.cofinancier_performance_assessment =
                dto.cofinancier_performance_assessment;
        if (dto.pmt_status !== undefined)
            row.pmt_status = dto.pmt_status;
        if (dto.awp_planned_next_qtr !== undefined)
            row.awp_planned_next_qtr = dto.awp_planned_next_qtr;
    }
    assertValidQuarter(quarter) {
        if (!Number.isInteger(quarter) || quarter < 1 || quarter > 4) {
            throw new common_1.UnprocessableEntityException(`quarter must be an integer 1–4 (got ${quarter})`);
        }
    }
    snapshot(row) {
        return {
            id: row.id,
            year: row.year,
            quarter: row.quarter,
            executive_summary: row.executive_summary,
            pdo_assessment: row.pdo_assessment,
            unanticipated_results: row.unanticipated_results,
            bank_performance_assessment: row.bank_performance_assessment,
            borrower_performance_assessment: row.borrower_performance_assessment,
            cofinancier_performance_assessment: row.cofinancier_performance_assessment,
            pmt_status: row.pmt_status,
            awp_planned_next_qtr: row.awp_planned_next_qtr,
            generated_at: row.generated_at,
            generated_by: row.generated_by,
        };
    }
};
exports.QuarterlyReportsService = QuarterlyReportsService;
exports.QuarterlyReportsService = QuarterlyReportsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(quarterly_progress_report_entity_js_1.QuarterlyProgressReport)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        audit_service_js_1.AuditService])
], QuarterlyReportsService);
//# sourceMappingURL=quarterly-reports.service.js.map