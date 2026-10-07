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
exports.CreateNodeDto = exports.NODE_TYPES = void 0;
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
exports.NODE_TYPES = [
    'pdo',
    'alignment',
    'component',
    'outcome_statement',
    'output_statement',
    'goal',
    'outcome',
    'output',
    'activity',
];
class CreateNodeDto {
    type;
    code;
    title;
    description;
    parent_id;
    order;
    budget_usd;
    budget_currency;
}
exports.CreateNodeDto = CreateNodeDto;
__decorate([
    (0, swagger_1.ApiProperty)({ enum: exports.NODE_TYPES, example: 'output_statement' }),
    (0, class_validator_1.IsIn)(exports.NODE_TYPES),
    __metadata("design:type", String)
], CreateNodeDto.prototype, "type", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'OS-1' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateNodeDto.prototype, "code", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Innovation Park Developed (Smart Green City)' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateNodeDto.prototype, "title", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'Component 1 deliverables on the EKZ site' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateNodeDto.prototype, "description", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'UUID of the parent node. Null for root types (pdo, legacy goal).',
        example: null,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", Object)
], CreateNodeDto.prototype, "parent_id", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 1, default: 0 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    __metadata("design:type", Number)
], CreateNodeDto.prototype, "order", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        example: 65000000,
        description: 'Budget envelope in the selected currency. Component nodes only.',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], CreateNodeDto.prototype, "budget_usd", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'USD', default: 'USD' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateNodeDto.prototype, "budget_currency", void 0);
//# sourceMappingURL=create-node.dto.js.map