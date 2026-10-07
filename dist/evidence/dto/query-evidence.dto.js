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
exports.QueryEvidenceDto = void 0;
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
const swagger_1 = require("@nestjs/swagger");
const document_types_js_1 = require("../constants/document-types.js");
class QueryEvidenceDto {
    document_type;
    indicator_id;
    indicator_progress_id;
    location_id;
    orphan;
    due_for_deletion;
    include_deleted;
    q;
    page;
    per_page;
}
exports.QueryEvidenceDto = QueryEvidenceDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Filter by document_type',
        enum: document_types_js_1.DOCUMENT_TYPES,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsIn)(document_types_js_1.DOCUMENT_TYPES),
    __metadata("design:type", String)
], QueryEvidenceDto.prototype, "document_type", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Filter by attached indicator' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], QueryEvidenceDto.prototype, "indicator_id", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Filter by attached progress row' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], QueryEvidenceDto.prototype, "indicator_progress_id", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Filter by attached project location' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], QueryEvidenceDto.prototype, "location_id", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Only orphan (unattached) docs' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBooleanString)(),
    __metadata("design:type", String)
], QueryEvidenceDto.prototype, "orphan", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Surface documents whose retention_until is past — admin-only filter',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBooleanString)(),
    __metadata("design:type", String)
], QueryEvidenceDto.prototype, "due_for_deletion", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Include soft-deleted rows (admin-only)',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBooleanString)(),
    __metadata("design:type", String)
], QueryEvidenceDto.prototype, "include_deleted", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Free-text search on title' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], QueryEvidenceDto.prototype, "q", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Page (1-indexed)', minimum: 1 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], QueryEvidenceDto.prototype, "page", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Page size',
        minimum: 1,
        maximum: 100,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.Max)(100),
    __metadata("design:type", Number)
], QueryEvidenceDto.prototype, "per_page", void 0);
//# sourceMappingURL=query-evidence.dto.js.map