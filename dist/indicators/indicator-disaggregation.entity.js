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
exports.IndicatorDisaggregation = void 0;
const typeorm_1 = require("typeorm");
const indicator_entity_js_1 = require("./indicator.entity.js");
let IndicatorDisaggregation = class IndicatorDisaggregation {
    id;
    indicator_id;
    indicator;
    axis;
    required;
    breakdown_target;
    notes;
    created_at;
    updated_at;
};
exports.IndicatorDisaggregation = IndicatorDisaggregation;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], IndicatorDisaggregation.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid' }),
    __metadata("design:type", String)
], IndicatorDisaggregation.prototype, "indicator_id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => indicator_entity_js_1.Indicator, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'indicator_id' }),
    __metadata("design:type", indicator_entity_js_1.Indicator)
], IndicatorDisaggregation.prototype, "indicator", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 40 }),
    __metadata("design:type", String)
], IndicatorDisaggregation.prototype, "axis", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'boolean', default: true }),
    __metadata("design:type", Boolean)
], IndicatorDisaggregation.prototype, "required", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', nullable: true }),
    __metadata("design:type", Object)
], IndicatorDisaggregation.prototype, "breakdown_target", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", Object)
], IndicatorDisaggregation.prototype, "notes", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ type: 'timestamptz' }),
    __metadata("design:type", Date)
], IndicatorDisaggregation.prototype, "created_at", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ type: 'timestamptz' }),
    __metadata("design:type", Date)
], IndicatorDisaggregation.prototype, "updated_at", void 0);
exports.IndicatorDisaggregation = IndicatorDisaggregation = __decorate([
    (0, typeorm_1.Entity)('indicator_disaggregations'),
    (0, typeorm_1.Unique)('indicator_disaggregations_indicator_axis_uq', ['indicator_id', 'axis'])
], IndicatorDisaggregation);
//# sourceMappingURL=indicator-disaggregation.entity.js.map