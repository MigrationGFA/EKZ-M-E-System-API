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
exports.ProgressBreakdownDto = exports.RollupQueryDto = exports.SetDisaggregationsDto = exports.UpsertDisaggregationDto = exports.DisaggregationAxis = void 0;
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
const swagger_1 = require("@nestjs/swagger");
var DisaggregationAxis;
(function (DisaggregationAxis) {
    DisaggregationAxis["SEX"] = "sex";
    DisaggregationAxis["AGE_BAND"] = "age_band";
    DisaggregationAxis["COHORT"] = "cohort";
    DisaggregationAxis["SKILL_LEVEL"] = "skill_level";
    DisaggregationAxis["GEOGRAPHY"] = "geography";
    DisaggregationAxis["UNIVERSITY_ORIGIN"] = "university_origin";
})(DisaggregationAxis || (exports.DisaggregationAxis = DisaggregationAxis = {}));
let NumericRecordConstraint = class NumericRecordConstraint {
    validate(value) {
        if (value === null || value === undefined)
            return true;
        if (typeof value !== 'object' || Array.isArray(value))
            return false;
        for (const v of Object.values(value)) {
            if (typeof v !== 'number' || !Number.isFinite(v) || v < 0)
                return false;
        }
        return true;
    }
    defaultMessage(args) {
        return `${args.property} must be an object whose values are finite non-negative numbers`;
    }
};
NumericRecordConstraint = __decorate([
    (0, class_validator_1.ValidatorConstraint)({ name: 'numericRecord', async: false })
], NumericRecordConstraint);
class UpsertDisaggregationDto {
    axis;
    required;
    breakdown_target;
    notes;
}
exports.UpsertDisaggregationDto = UpsertDisaggregationDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        enum: DisaggregationAxis,
        example: DisaggregationAxis.SEX,
        description: 'Disaggregation axis (Phase 4 / ADR 0003 vocabulary)',
    }),
    (0, class_validator_1.IsEnum)(DisaggregationAxis),
    __metadata("design:type", String)
], UpsertDisaggregationDto.prototype, "axis", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        default: true,
        description: 'Whether progress entries must carry a breakdown on this axis',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], UpsertDisaggregationDto.prototype, "required", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        example: { female: 0.4 },
        description: 'Axis-specific target. Ratios (0..1) for sex/age_band/skill_level; absolute counts for cohort.',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsObject)(),
    (0, class_validator_1.Validate)(NumericRecordConstraint),
    __metadata("design:type", Object)
], UpsertDisaggregationDto.prototype, "breakdown_target", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Free-text annotation' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpsertDisaggregationDto.prototype, "notes", void 0);
class SetDisaggregationsDto {
    rules;
}
exports.SetDisaggregationsDto = SetDisaggregationsDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        type: [UpsertDisaggregationDto],
        description: 'Full set of disaggregation rules for the indicator. Replaces existing rules.',
    }),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => UpsertDisaggregationDto),
    __metadata("design:type", Array)
], SetDisaggregationsDto.prototype, "rules", void 0);
class RollupQueryDto {
    axis;
}
exports.RollupQueryDto = RollupQueryDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        enum: DisaggregationAxis,
        example: DisaggregationAxis.SEX,
        description: 'Axis to aggregate over',
    }),
    (0, class_validator_1.IsEnum)(DisaggregationAxis),
    __metadata("design:type", String)
], RollupQueryDto.prototype, "axis", void 0);
class ProgressBreakdownDto {
    axis;
    value_breakdown;
}
exports.ProgressBreakdownDto = ProgressBreakdownDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        enum: DisaggregationAxis,
        example: DisaggregationAxis.SEX,
    }),
    (0, class_validator_1.IsEnum)(DisaggregationAxis),
    __metadata("design:type", String)
], ProgressBreakdownDto.prototype, "axis", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        example: { male: 1200, female: 800 },
        description: 'Numeric splits matching the axis buckets',
    }),
    (0, class_validator_1.IsObject)(),
    (0, class_validator_1.Validate)(NumericRecordConstraint),
    __metadata("design:type", Object)
], ProgressBreakdownDto.prototype, "value_breakdown", void 0);
//# sourceMappingURL=disaggregation.dto.js.map