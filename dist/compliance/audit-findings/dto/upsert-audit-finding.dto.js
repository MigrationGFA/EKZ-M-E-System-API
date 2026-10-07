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
exports.UpsertAuditFindingDto = exports.AUDIT_STATUSES = void 0;
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
exports.AUDIT_STATUSES = [
    'pending_initiation',
    'in_progress',
    'finalized',
];
class UpsertAuditFindingDto {
    year;
    audit_status;
    key_issue;
    corrective_measures;
    comments;
    expected_submission_date;
    order;
}
exports.UpsertAuditFindingDto = UpsertAuditFindingDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 2025, minimum: 2000, maximum: 2100 }),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(2000),
    (0, class_validator_1.Max)(2100),
    __metadata("design:type", Number)
], UpsertAuditFindingDto.prototype, "year", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ enum: exports.AUDIT_STATUSES }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsIn)(exports.AUDIT_STATUSES),
    __metadata("design:type", String)
], UpsertAuditFindingDto.prototype, "audit_status", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Inadequate segregation of duties in procurement' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpsertAuditFindingDto.prototype, "key_issue", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpsertAuditFindingDto.prototype, "corrective_measures", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpsertAuditFindingDto.prototype, "comments", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: '2026-06-30' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], UpsertAuditFindingDto.prototype, "expected_submission_date", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    __metadata("design:type", Number)
], UpsertAuditFindingDto.prototype, "order", void 0);
//# sourceMappingURL=upsert-audit-finding.dto.js.map