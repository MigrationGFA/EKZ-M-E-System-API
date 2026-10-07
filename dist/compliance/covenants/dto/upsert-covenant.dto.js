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
exports.UpsertCovenantDto = exports.COVENANT_STATUSES = exports.COVENANT_TYPES = void 0;
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
exports.COVENANT_TYPES = [
    'entry_into_force',
    'first_disbursement',
    'undertaking',
];
exports.COVENANT_STATUSES = [
    'pending_initiation',
    'in_progress',
    'finalized',
];
class UpsertCovenantDto {
    covenant_text;
    type;
    status;
    comments;
    order;
}
exports.UpsertCovenantDto = UpsertCovenantDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        example: 'The Borrower shall maintain an environmental and social management system…',
    }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpsertCovenantDto.prototype, "covenant_text", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ enum: exports.COVENANT_TYPES }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsIn)(exports.COVENANT_TYPES),
    __metadata("design:type", String)
], UpsertCovenantDto.prototype, "type", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ enum: exports.COVENANT_STATUSES }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsIn)(exports.COVENANT_STATUSES),
    __metadata("design:type", String)
], UpsertCovenantDto.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpsertCovenantDto.prototype, "comments", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    __metadata("design:type", Number)
], UpsertCovenantDto.prototype, "order", void 0);
//# sourceMappingURL=upsert-covenant.dto.js.map