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
exports.CreateIndicatorDto = void 0;
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
class CreateIndicatorDto {
    code;
    name;
    description;
    level;
    kind;
    unit;
    baseline;
    target;
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
    status;
    current_value;
}
exports.CreateIndicatorDto = CreateIndicatorDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'OUT-1.1' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateIndicatorDto.prototype, "code", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Number of youths completing technical training' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateIndicatorDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Measures completion of TVET programmes by youth' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateIndicatorDto.prototype, "description", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ enum: LEVELS, example: 'output' }),
    (0, class_validator_1.IsIn)(LEVELS),
    __metadata("design:type", String)
], CreateIndicatorDto.prototype, "level", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        enum: KINDS,
        default: 'output',
        description: 'AfDB RBM discriminator. Defaults to "output". Used together with `code` for uniqueness so e.g. Outcome 1.1 and Output 1.1 may coexist.',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsIn)(KINDS),
    __metadata("design:type", String)
], CreateIndicatorDto.prototype, "kind", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'individuals' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateIndicatorDto.prototype, "unit", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 0, default: 0 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], CreateIndicatorDto.prototype, "baseline", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 5000 }),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], CreateIndicatorDto.prototype, "target", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ enum: FREQUENCIES, example: 'quarterly' }),
    (0, class_validator_1.IsIn)(FREQUENCIES),
    __metadata("design:type", String)
], CreateIndicatorDto.prototype, "frequency", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Free-text methodology / measurement notes from the Monitoring Plan.',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateIndicatorDto.prototype, "methodology", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'True if the indicator rolls up into the AfDB Results Measurement Framework / ADoA reporting.',
        default: false,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], CreateIndicatorDto.prototype, "rmf_adoa", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        enum: TARGET_MODES,
        default: 'cumulative',
        description: 'How year targets accumulate. `binary` covers Yes/No indicators (e.g. policy operationalised).',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsIn)(TARGET_MODES),
    __metadata("design:type", String)
], CreateIndicatorDto.prototype, "target_mode", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        enum: DATA_SOURCE_TYPES,
        default: 'form_submission',
        description: 'Drives UI affordances. `external_feed` indicators do not auto-populate from form submissions.',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsIn)(DATA_SOURCE_TYPES),
    __metadata("design:type", String)
], CreateIndicatorDto.prototype, "data_source_type", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        example: 2023,
        description: 'First reporting year. Defaults at runtime to project baseline year if omitted.',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    __metadata("design:type", Number)
], CreateIndicatorDto.prototype, "reporting_year_start", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        example: 2028,
        description: 'Last reporting year. Defaults at runtime to project completion year if omitted.',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    __metadata("design:type", Number)
], CreateIndicatorDto.prototype, "reporting_year_end", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'UUID of the logframe node this indicator is linked to',
        nullable: true,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", Object)
], CreateIndicatorDto.prototype, "logframe_level_id", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ type: [Number], example: [4, 8] }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    __metadata("design:type", Array)
], CreateIndicatorDto.prototype, "sdg_ids", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'TVET Directorate' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateIndicatorDto.prototype, "responsible_party", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Training completion certificates' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateIndicatorDto.prototype, "means_of_verification", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Ignored on create — auto-computed from baseline/target ratio',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateIndicatorDto.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Ignored on create — defaults to baseline value',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], CreateIndicatorDto.prototype, "current_value", void 0);
//# sourceMappingURL=create-indicator.dto.js.map