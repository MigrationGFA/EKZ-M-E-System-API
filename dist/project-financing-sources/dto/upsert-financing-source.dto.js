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
exports.UpsertFinancingSourceDto = exports.FINANCING_INSTRUMENTS = void 0;
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
exports.FINANCING_INSTRUMENTS = [
    'loan',
    'grant',
    'cofinancing',
    'counterpart',
];
class UpsertFinancingSourceDto {
    source_name;
    instrument;
    total_approved_ua;
    disbursed_ua;
    order;
}
exports.UpsertFinancingSourceDto = UpsertFinancingSourceDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'AfDB ADF Grant' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpsertFinancingSourceDto.prototype, "source_name", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ enum: exports.FINANCING_INSTRUMENTS }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsIn)(exports.FINANCING_INSTRUMENTS),
    __metadata("design:type", String)
], UpsertFinancingSourceDto.prototype, "instrument", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 25_000_000 }),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], UpsertFinancingSourceDto.prototype, "total_approved_ua", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 8_400_000, default: 0 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], UpsertFinancingSourceDto.prototype, "disbursed_ua", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ default: 0 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    __metadata("design:type", Number)
], UpsertFinancingSourceDto.prototype, "order", void 0);
//# sourceMappingURL=upsert-financing-source.dto.js.map