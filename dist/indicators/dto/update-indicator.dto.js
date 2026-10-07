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
exports.UpdateIndicatorDto = void 0;
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
const LEVELS = [
    'alignment',
    'impact',
    'outcome',
    'output',
    'activity',
];
const KINDS = ['alignment', 'outcome', 'output', 'activity'];
const FREQUENCIES = [
    'monthly',
    'quarterly',
    'bi_annually',
    'annually',
    'mid_term',
    'one_off',
];
const TARGET_MODES = ['cumulative', 'incremental', 'binary'];
const DATA_SOURCE_TYPES = [
    'form_submission',
    'tracer_study',
    'contractor_report',
    'financial_statement',
    'policy_document',
    'external_feed',
    'manual',
];
class UpdateIndicatorDto {
    code;
    name;
    description;
    level;
    kind;
    unit;
    baseline;
    target;
    current_value;
    frequency;
    methodology;
    rmf_adoa;
    target_mode;
    data_source_type;
    reporting_year_start;
    reporting_year_end;
    logframe_level_id;
    sdg_ids;
    responsible_party;
    means_of_verification;
}
exports.UpdateIndicatorDto = UpdateIndicatorDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'OUT-1.1' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateIndicatorDto.prototype, "code", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateIndicatorDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateIndicatorDto.prototype, "description", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ enum: LEVELS }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsIn)(LEVELS),
    __metadata("design:type", String)
], UpdateIndicatorDto.prototype, "level", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ enum: KINDS }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsIn)(KINDS),
    __metadata("design:type", String)
], UpdateIndicatorDto.prototype, "kind", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'individuals' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateIndicatorDto.prototype, "unit", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 0 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], UpdateIndicatorDto.prototype, "baseline", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 5000 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], UpdateIndicatorDto.prototype, "target", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        example: 3450,
        description: 'Triggers status recomputation',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], UpdateIndicatorDto.prototype, "current_value", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ enum: FREQUENCIES }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsIn)(FREQUENCIES),
    __metadata("design:type", String)
], UpdateIndicatorDto.prototype, "frequency", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Free-text methodology / measurement notes.',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateIndicatorDto.prototype, "methodology", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'True if the indicator rolls up into AfDB RMF / ADoA reporting.',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], UpdateIndicatorDto.prototype, "rmf_adoa", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ enum: TARGET_MODES }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsIn)(TARGET_MODES),
    __metadata("design:type", String)
], UpdateIndicatorDto.prototype, "target_mode", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ enum: DATA_SOURCE_TYPES }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsIn)(DATA_SOURCE_TYPES),
    __metadata("design:type", String)
], UpdateIndicatorDto.prototype, "data_source_type", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 2023 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    __metadata("design:type", Number)
], UpdateIndicatorDto.prototype, "reporting_year_start", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 2028 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    __metadata("design:type", Number)
], UpdateIndicatorDto.prototype, "reporting_year_end", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ nullable: true }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", Object)
], UpdateIndicatorDto.prototype, "logframe_level_id", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ type: [Number], example: [4, 8] }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    __metadata("design:type", Array)
], UpdateIndicatorDto.prototype, "sdg_ids", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateIndicatorDto.prototype, "responsible_party", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateIndicatorDto.prototype, "means_of_verification", void 0);
//# sourceMappingURL=update-indicator.dto.js.map