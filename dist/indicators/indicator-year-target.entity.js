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
exports.IndicatorYearTarget = void 0;
const typeorm_1 = require("typeorm");
let IndicatorYearTarget = class IndicatorYearTarget {
    id;
    indicator_id;
    year;
    target_value;
    notes;
    is_original;
    revision_year;
    created_at;
    updated_at;
};
exports.IndicatorYearTarget = IndicatorYearTarget;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], IndicatorYearTarget.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid' }),
    __metadata("design:type", String)
], IndicatorYearTarget.prototype, "indicator_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int' }),
    __metadata("design:type", Number)
], IndicatorYearTarget.prototype, "year", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'numeric' }),
    __metadata("design:type", Number)
], IndicatorYearTarget.prototype, "target_value", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", Object)
], IndicatorYearTarget.prototype, "notes", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'boolean', default: true }),
    __metadata("design:type", Boolean)
], IndicatorYearTarget.prototype, "is_original", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', nullable: true }),
    __metadata("design:type", Object)
], IndicatorYearTarget.prototype, "revision_year", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ type: 'timestamptz' }),
    __metadata("design:type", Date)
], IndicatorYearTarget.prototype, "created_at", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ type: 'timestamptz' }),
    __metadata("design:type", Date)
], IndicatorYearTarget.prototype, "updated_at", void 0);
exports.IndicatorYearTarget = IndicatorYearTarget = __decorate([
    (0, typeorm_1.Entity)('indicator_year_targets'),
    (0, typeorm_1.Index)('indicator_year_targets_year_idx', ['year']),
    (0, typeorm_1.Index)('iyt_indicator_year_original_uniq', ['indicator_id', 'year', 'is_original'], {
        unique: true,
    })
], IndicatorYearTarget);
//# sourceMappingURL=indicator-year-target.entity.js.map