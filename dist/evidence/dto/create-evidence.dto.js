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
exports.CreateEvidenceDto = void 0;
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
const document_types_js_1 = require("../constants/document-types.js");
class CreateEvidenceDto {
    title;
    description;
    document_type;
    type_metadata;
    reference_period_from;
    reference_period_to;
    file_url;
    file_size_bytes;
    mime_type;
    sha256;
    retention_until;
    indicator_id;
    indicator_progress_id;
    location_id;
}
exports.CreateEvidenceDto = CreateEvidenceDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Document title', maxLength: 500 }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(500),
    __metadata("design:type", String)
], CreateEvidenceDto.prototype, "title", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Free-text description' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateEvidenceDto.prototype, "description", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Document type (locked 18-value enum per ADR 0005)',
        enum: document_types_js_1.DOCUMENT_TYPES,
    }),
    (0, class_validator_1.IsIn)(document_types_js_1.DOCUMENT_TYPES),
    __metadata("design:type", String)
], CreateEvidenceDto.prototype, "document_type", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Per-type metadata. Required fields depend on document_type.',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsObject)(),
    __metadata("design:type", Object)
], CreateEvidenceDto.prototype, "type_metadata", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Period start (ISO date). Required for time-bound types.',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], CreateEvidenceDto.prototype, "reference_period_from", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Period end (ISO date). Required for time-bound types.',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], CreateEvidenceDto.prototype, "reference_period_to", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Public URL returned by the upload endpoint' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateEvidenceDto.prototype, "file_url", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'File size in bytes' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateEvidenceDto.prototype, "file_size_bytes", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'MIME type recorded at upload time' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(100),
    __metadata("design:type", String)
], CreateEvidenceDto.prototype, "mime_type", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'SHA-256 hex digest of the uploaded bytes' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(64),
    __metadata("design:type", String)
], CreateEvidenceDto.prototype, "sha256", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Optional override of the default retention timestamp. ISO string.',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], CreateEvidenceDto.prototype, "retention_until", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Attach to an indicator (mutually exclusive with the others)',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], CreateEvidenceDto.prototype, "indicator_id", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Attach to an indicator-progress row' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], CreateEvidenceDto.prototype, "indicator_progress_id", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Attach to a project location' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], CreateEvidenceDto.prototype, "location_id", void 0);
//# sourceMappingURL=create-evidence.dto.js.map