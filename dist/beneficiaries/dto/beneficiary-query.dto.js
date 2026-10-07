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
exports.BeneficiaryQueryDto = void 0;
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
class BeneficiaryQueryDto {
    q;
    community;
    cohort;
    include_inactive;
}
exports.BeneficiaryQueryDto = BeneficiaryQueryDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Free-text search on full_name.' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], BeneficiaryQueryDto.prototype, "q", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Filter by community.' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], BeneficiaryQueryDto.prototype, "community", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Filter by cohort code.' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], BeneficiaryQueryDto.prototype, "cohort", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Include inactive (soft-deleted) records. Defaults to false; admin/me_staff only.',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBooleanString)(),
    __metadata("design:type", String)
], BeneficiaryQueryDto.prototype, "include_inactive", void 0);
//# sourceMappingURL=beneficiary-query.dto.js.map