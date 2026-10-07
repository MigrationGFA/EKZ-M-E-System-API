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
exports.FindIndicatorsQueryDto = void 0;
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
const swagger_1 = require("@nestjs/swagger");
const KINDS = ['alignment', 'outcome', 'output', 'activity'];
const FREQUENCIES = [
    'monthly',
    'quarterly',
    'bi_annually',
    'annually',
    'mid_term',
    'one_off',
];
const DATA_SOURCE_TYPES = [
    'form_submission',
    'tracer_study',
    'contractor_report',
    'financial_statement',
    'policy_document',
    'external_feed',
    'manual',
];
const STATUSES = ['on_track', 'at_risk', 'off_track'];
class FindIndicatorsQueryDto {
    status;
    logframe_level_id;
    sdg_id;
    frequency;
    kind;
    rmf_adoa;
    data_source_type;
    search;
    page;
    per_page;
}
exports.FindIndicatorsQueryDto = FindIndicatorsQueryDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ enum: STATUSES }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsIn)(STATUSES),
    __metadata("design:type", String)
], FindIndicatorsQueryDto.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Filter by logframe node UUID' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], FindIndicatorsQueryDto.prototype, "logframe_level_id", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ type: Number }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumberString)(),
    __metadata("design:type", String)
], FindIndicatorsQueryDto.prototype, "sdg_id", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ enum: FREQUENCIES }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsIn)(FREQUENCIES),
    __metadata("design:type", String)
], FindIndicatorsQueryDto.prototype, "frequency", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        enum: KINDS,
        description: 'AfDB RBM discriminator',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsIn)(KINDS),
    __metadata("design:type", String)
], FindIndicatorsQueryDto.prototype, "kind", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        type: Boolean,
        description: 'Filter to RMF/ADoA-rolled-up indicators only',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Transform)(({ value }) => {
        if (value === 'true' || value === '1' || value === true)
            return true;
        if (value === 'false' || value === '0' || value === false)
            return false;
        return value;
    }),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], FindIndicatorsQueryDto.prototype, "rmf_adoa", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ enum: DATA_SOURCE_TYPES }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsIn)(DATA_SOURCE_TYPES),
    __metadata("design:type", String)
], FindIndicatorsQueryDto.prototype, "data_source_type", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Search by name or code (ILIKE)' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], FindIndicatorsQueryDto.prototype, "search", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ type: Number }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumberString)(),
    __metadata("design:type", String)
], FindIndicatorsQueryDto.prototype, "page", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ type: Number }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumberString)(),
    __metadata("design:type", String)
], FindIndicatorsQueryDto.prototype, "per_page", void 0);
//# sourceMappingURL=find-indicators-query.dto.js.map