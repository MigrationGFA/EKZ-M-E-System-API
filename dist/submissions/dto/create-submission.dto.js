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
exports.CreateSubmissionDto = void 0;
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
const swagger_1 = require("@nestjs/swagger");
class LocationDto {
    lat;
    lng;
}
__decorate([
    (0, swagger_1.ApiProperty)({ example: 7.6211 }),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], LocationDto.prototype, "lat", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 5.2216 }),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], LocationDto.prototype, "lng", void 0);
class CreateSubmissionDto {
    id;
    formId;
    officerId;
    data;
    location;
    submittedAt;
    beneficiaryId;
}
exports.CreateSubmissionDto = CreateSubmissionDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Client-generated UUID v4. Must be unique. Used for idempotent offline sync.',
    }),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], CreateSubmissionDto.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'UUID of the form being submitted' }),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], CreateSubmissionDto.prototype, "formId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'UUID of the field officer submitting' }),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], CreateSubmissionDto.prototype, "officerId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Key-value pairs using form field labels as keys',
        example: { 'Full Name': 'John Doe', Age: 24 },
    }),
    (0, class_validator_1.IsObject)(),
    __metadata("design:type", Object)
], CreateSubmissionDto.prototype, "data", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        type: LocationDto,
        nullable: true,
        description: 'GPS coordinates. If provided, geofencing runs server-side.',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.ValidateNested)(),
    (0, class_transformer_1.Type)(() => LocationDto),
    __metadata("design:type", Object)
], CreateSubmissionDto.prototype, "location", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '2026-04-09T10:00:00Z' }),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], CreateSubmissionDto.prototype, "submittedAt", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Optional beneficiary UUID. When set, applyFieldMappings can derive disaggregation breakdowns from the linked beneficiary attributes.',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], CreateSubmissionDto.prototype, "beneficiaryId", void 0);
//# sourceMappingURL=create-submission.dto.js.map