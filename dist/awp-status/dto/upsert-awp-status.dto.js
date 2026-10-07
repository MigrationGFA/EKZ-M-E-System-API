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
exports.UpsertAwpStatusDto = exports.AWP_STATUSES = void 0;
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
exports.AWP_STATUSES = [
    'pending_initiation',
    'in_progress',
    'finalized',
    'cancelled',
];
class UpsertAwpStatusDto {
    status;
    pct_achievement;
    comments;
    planned_for_next_qtr;
    deadline;
}
exports.UpsertAwpStatusDto = UpsertAwpStatusDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ enum: exports.AWP_STATUSES }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsIn)(exports.AWP_STATUSES),
    __metadata("design:type", String)
], UpsertAwpStatusDto.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 75, minimum: 0, maximum: 100 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(0),
    (0, class_validator_1.Max)(100),
    __metadata("design:type", Number)
], UpsertAwpStatusDto.prototype, "pct_achievement", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpsertAwpStatusDto.prototype, "comments", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Flag this activity as planned for the NEXT quarter (renders in C.2.2 of the QPR PDF).',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], UpsertAwpStatusDto.prototype, "planned_for_next_qtr", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: '2026-09-30' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], UpsertAwpStatusDto.prototype, "deadline", void 0);
//# sourceMappingURL=upsert-awp-status.dto.js.map