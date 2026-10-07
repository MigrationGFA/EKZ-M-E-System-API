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
exports.UpsertProjectMetaDto = void 0;
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
class UpsertProjectMetaDto {
    name;
    sap_code;
    pdo_text;
    baseline_year;
    completion_year;
    midpoint_date;
    pdo_node_id;
    sector;
    country;
    executing_agency;
    responsible_project_staff;
    original_disbursement_deadline;
    revised_disbursement_deadline;
}
exports.UpsertProjectMetaDto = UpsertProjectMetaDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Ekiti Knowledge Zone Project' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpsertProjectMetaDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        example: 'P-NG-K00-009',
        description: 'AfDB SAP code for the project',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpsertProjectMetaDto.prototype, "sap_code", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        example: 'To promote knowledge economy value chain through innovation and entrepreneurship in technology industry.',
    }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpsertProjectMetaDto.prototype, "pdo_text", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 2022, minimum: 2000, maximum: 2100 }),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(2000),
    (0, class_validator_1.Max)(2100),
    __metadata("design:type", Number)
], UpsertProjectMetaDto.prototype, "baseline_year", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 2028, minimum: 2000, maximum: 2100 }),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(2000),
    (0, class_validator_1.Max)(2100),
    __metadata("design:type", Number)
], UpsertProjectMetaDto.prototype, "completion_year", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        example: '2025-06-30',
        description: 'Project midpoint date (ISO format YYYY-MM-DD)',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], UpsertProjectMetaDto.prototype, "midpoint_date", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'UUID of the PDO logframe node. Must reference an existing node of type "pdo".',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", Object)
], UpsertProjectMetaDto.prototype, "pdo_node_id", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'Knowledge Economy / ICT' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpsertProjectMetaDto.prototype, "sector", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'Nigeria', default: 'Nigeria' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpsertProjectMetaDto.prototype, "country", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'EKDIPA' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpsertProjectMetaDto.prototype, "executing_agency", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'Dr. Olamide Ade' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpsertProjectMetaDto.prototype, "responsible_project_staff", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        example: '2028-12-31',
        description: 'Original disbursement deadline per the financing agreement (PAR).',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], UpsertProjectMetaDto.prototype, "original_disbursement_deadline", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        example: '2029-06-30',
        description: 'Revised disbursement deadline after any extensions. Null if unchanged.',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], UpsertProjectMetaDto.prototype, "revised_disbursement_deadline", void 0);
//# sourceMappingURL=upsert-project-meta.dto.js.map