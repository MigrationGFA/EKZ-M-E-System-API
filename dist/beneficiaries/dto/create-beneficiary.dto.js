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
exports.CreateBeneficiaryDto = void 0;
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
const SEX_VALUES = ['female', 'male', 'other', 'prefer_not'];
const AGE_BAND_VALUES = [
    'under_18',
    '18_24',
    '25_34',
    '35_plus',
];
const CONSENT_METHOD_VALUES = [
    'paper_signature',
    'digital_signature',
    'verbal_recorded',
    'sms_opt_in',
];
class CreateBeneficiaryDto {
    id;
    full_name;
    sex;
    date_of_birth;
    age_band;
    community;
    household_id;
    phone_e164;
    national_id_raw;
    skill_level;
    disability_status;
    notes;
    consent_given;
    consent_date;
    consent_method;
    cohort_codes;
}
exports.CreateBeneficiaryDto = CreateBeneficiaryDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Optional client-generated UUID. Required for offline registrations so the same record syncs idempotently.',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateBeneficiaryDto.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Adeola Adeyemi' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Length)(1, 255),
    __metadata("design:type", String)
], CreateBeneficiaryDto.prototype, "full_name", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ enum: SEX_VALUES }),
    (0, class_validator_1.IsIn)(SEX_VALUES),
    __metadata("design:type", String)
], CreateBeneficiaryDto.prototype, "sex", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: '1998-04-12' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], CreateBeneficiaryDto.prototype, "date_of_birth", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ enum: AGE_BAND_VALUES }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsIn)(AGE_BAND_VALUES),
    __metadata("design:type", String)
], CreateBeneficiaryDto.prototype, "age_band", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'Ago Araromi' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(255),
    __metadata("design:type", String)
], CreateBeneficiaryDto.prototype, "community", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(100),
    __metadata("design:type", String)
], CreateBeneficiaryDto.prototype, "household_id", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        example: '+2348012345678',
        description: 'E.164 phone number. Redacted in list endpoints.',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Matches)(/^\+[1-9]\d{6,14}$/, { message: 'phone_e164 must be E.164 format' }),
    __metadata("design:type", String)
], CreateBeneficiaryDto.prototype, "phone_e164", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Raw NIN — hashed server-side before persistence (ADR 0006). Never round-trips back to clients.',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Matches)(/^\d{11}$/, { message: 'NIN must be 11 digits' }),
    __metadata("design:type", String)
], CreateBeneficiaryDto.prototype, "national_id_raw", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'basic' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(40),
    __metadata("design:type", String)
], CreateBeneficiaryDto.prototype, "skill_level", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], CreateBeneficiaryDto.prototype, "disability_status", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateBeneficiaryDto.prototype, "notes", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Required. Per ADR 0006 a beneficiary record is only permitted without consent for aggregate-only entries.',
    }),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], CreateBeneficiaryDto.prototype, "consent_given", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], CreateBeneficiaryDto.prototype, "consent_date", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ enum: CONSENT_METHOD_VALUES }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsIn)(CONSENT_METHOD_VALUES),
    __metadata("design:type", String)
], CreateBeneficiaryDto.prototype, "consent_method", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        type: [String],
        description: 'Cohort codes to attach explicitly. Derived cohorts are added automatically.',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", Array)
], CreateBeneficiaryDto.prototype, "cohort_codes", void 0);
//# sourceMappingURL=create-beneficiary.dto.js.map