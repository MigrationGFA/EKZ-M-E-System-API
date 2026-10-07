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
exports.UpsertQuarterlyReportDto = exports.UnanticipatedResultDto = exports.UNANTICIPATED_CATEGORIES = void 0;
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
const swagger_1 = require("@nestjs/swagger");
exports.UNANTICIPATED_CATEGORIES = [
    'gender',
    'climate',
    'civil_society',
    'private_sector',
    'hiv_aids',
    'other',
];
class UnanticipatedResultDto {
    category;
    text;
}
exports.UnanticipatedResultDto = UnanticipatedResultDto;
__decorate([
    (0, swagger_1.ApiProperty)({ enum: exports.UNANTICIPATED_CATEGORIES }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsIn)(exports.UNANTICIPATED_CATEGORIES),
    __metadata("design:type", String)
], UnanticipatedResultDto.prototype, "category", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UnanticipatedResultDto.prototype, "text", void 0);
class UpsertQuarterlyReportDto {
    executive_summary;
    pdo_assessment;
    unanticipated_results;
    bank_performance_assessment;
    borrower_performance_assessment;
    cofinancier_performance_assessment;
    pmt_status;
    awp_planned_next_qtr;
}
exports.UpsertQuarterlyReportDto = UpsertQuarterlyReportDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpsertQuarterlyReportDto.prototype, "executive_summary", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpsertQuarterlyReportDto.prototype, "pdo_assessment", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ type: [UnanticipatedResultDto] }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => UnanticipatedResultDto),
    __metadata("design:type", Array)
], UpsertQuarterlyReportDto.prototype, "unanticipated_results", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpsertQuarterlyReportDto.prototype, "bank_performance_assessment", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpsertQuarterlyReportDto.prototype, "borrower_performance_assessment", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpsertQuarterlyReportDto.prototype, "cofinancier_performance_assessment", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpsertQuarterlyReportDto.prototype, "pmt_status", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpsertQuarterlyReportDto.prototype, "awp_planned_next_qtr", void 0);
//# sourceMappingURL=upsert-quarterly-report.dto.js.map