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
exports.CreateLocationDto = void 0;
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
class CreateLocationDto {
    name;
    sector;
    description;
    lat;
    lng;
    radius_m;
    indicator_ids;
    created_by;
}
exports.CreateLocationDto = CreateLocationDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'EKZ TVET Centre' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateLocationDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Education' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateLocationDto.prototype, "sector", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'Main vocational training facility' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateLocationDto.prototype, "description", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 7.6211, description: 'Latitude in decimal degrees' }),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], CreateLocationDto.prototype, "lat", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 5.2216, description: 'Longitude in decimal degrees' }),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], CreateLocationDto.prototype, "lng", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        example: 500,
        default: 500,
        description: 'Geofence radius in metres',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    __metadata("design:type", Number)
], CreateLocationDto.prototype, "radius_m", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        type: [String],
        description: 'Linked indicator UUIDs. Used to compute status and completion.',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsUUID)('4', { each: true }),
    __metadata("design:type", Array)
], CreateLocationDto.prototype, "indicator_ids", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'UUID of the user creating this location' }),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], CreateLocationDto.prototype, "created_by", void 0);
//# sourceMappingURL=create-location.dto.js.map