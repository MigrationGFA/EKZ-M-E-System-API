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
exports.CreateProgressDto = void 0;
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
const swagger_1 = require("@nestjs/swagger");
const disaggregation_dto_js_1 = require("./disaggregation.dto.js");
class CreateProgressDto {
    value;
    date;
    notes;
    submittedBy;
    breakdowns;
}
exports.CreateProgressDto = CreateProgressDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 3450, description: 'Progress value to record' }),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], CreateProgressDto.prototype, "value", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        example: '2026-04-13T00:00:00Z',
        description: 'Date of the progress entry',
    }),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], CreateProgressDto.prototype, "date", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'Q1 field verification complete' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateProgressDto.prototype, "notes", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        example: 'Funke Ogunleye',
        description: 'Display name of the person logging progress',
    }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateProgressDto.prototype, "submittedBy", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        type: [disaggregation_dto_js_1.ProgressBreakdownDto],
        description: 'Optional per-axis breakdowns (Phase 4 disaggregation). Each axis appears at most once.',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => disaggregation_dto_js_1.ProgressBreakdownDto),
    __metadata("design:type", Array)
], CreateProgressDto.prototype, "breakdowns", void 0);
//# sourceMappingURL=create-progress.dto.js.map