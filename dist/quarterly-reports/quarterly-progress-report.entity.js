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
Object.defineProperty(exports, "__esModule", { value: true });
exports.QuarterlyProgressReport = void 0;
const typeorm_1 = require("typeorm");
let QuarterlyProgressReport = class QuarterlyProgressReport {
    id;
    year;
    quarter;
    executive_summary;
    pdo_assessment;
    unanticipated_results;
    bank_performance_assessment;
    borrower_performance_assessment;
    cofinancier_performance_assessment;
    pmt_status;
    awp_planned_next_qtr;
    generated_at;
    generated_by;
    created_at;
    updated_at;
};
exports.QuarterlyProgressReport = QuarterlyProgressReport;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], QuarterlyProgressReport.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int' }),
    __metadata("design:type", Number)
], QuarterlyProgressReport.prototype, "year", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int' }),
    __metadata("design:type", Number)
], QuarterlyProgressReport.prototype, "quarter", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', default: '' }),
    __metadata("design:type", String)
], QuarterlyProgressReport.prototype, "executive_summary", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', default: '' }),
    __metadata("design:type", String)
], QuarterlyProgressReport.prototype, "pdo_assessment", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', default: '[]' }),
    __metadata("design:type", Array)
], QuarterlyProgressReport.prototype, "unanticipated_results", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', default: '' }),
    __metadata("design:type", String)
], QuarterlyProgressReport.prototype, "bank_performance_assessment", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', default: '' }),
    __metadata("design:type", String)
], QuarterlyProgressReport.prototype, "borrower_performance_assessment", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', default: '' }),
    __metadata("design:type", String)
], QuarterlyProgressReport.prototype, "cofinancier_performance_assessment", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', default: '' }),
    __metadata("design:type", String)
], QuarterlyProgressReport.prototype, "pmt_status", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', default: '' }),
    __metadata("design:type", String)
], QuarterlyProgressReport.prototype, "awp_planned_next_qtr", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamptz', nullable: true }),
    __metadata("design:type", Object)
], QuarterlyProgressReport.prototype, "generated_at", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 255, nullable: true }),
    __metadata("design:type", Object)
], QuarterlyProgressReport.prototype, "generated_by", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ type: 'timestamptz' }),
    __metadata("design:type", Date)
], QuarterlyProgressReport.prototype, "created_at", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ type: 'timestamptz' }),
    __metadata("design:type", Date)
], QuarterlyProgressReport.prototype, "updated_at", void 0);
exports.QuarterlyProgressReport = QuarterlyProgressReport = __decorate([
    (0, typeorm_1.Entity)('quarterly_progress_reports'),
    (0, typeorm_1.Index)('qpr_year_quarter_uniq', ['year', 'quarter'], { unique: true })
], QuarterlyProgressReport);
//# sourceMappingURL=quarterly-progress-report.entity.js.map