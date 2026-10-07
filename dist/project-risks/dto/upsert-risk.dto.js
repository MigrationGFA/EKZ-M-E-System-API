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
exports.UpsertRiskDto = exports.RISK_STATUSES = void 0;
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
exports.RISK_STATUSES = [
    'pending_initiation',
    'in_progress',
    'finalized',
];
class UpsertRiskDto {
    key_issue;
    corrective_action;
    responsibility;
    deadline;
    status;
    comments;
}
exports.UpsertRiskDto = UpsertRiskDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Delayed land acquisition for Block C' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpsertRiskDto.prototype, "key_issue", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpsertRiskDto.prototype, "corrective_action", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpsertRiskDto.prototype, "responsibility", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: '2026-09-30' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], UpsertRiskDto.prototype, "deadline", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ enum: exports.RISK_STATUSES, default: 'pending_initiation' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsIn)(exports.RISK_STATUSES),
    __metadata("design:type", String)
], UpsertRiskDto.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpsertRiskDto.prototype, "comments", void 0);
//# sourceMappingURL=upsert-risk.dto.js.map