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
exports.IndicatorProgressBreakdown = void 0;
const typeorm_1 = require("typeorm");
const indicator_progress_entity_js_1 = require("./indicator-progress.entity.js");
let IndicatorProgressBreakdown = class IndicatorProgressBreakdown {
    progress_id;
    progress;
    axis;
    value_breakdown;
    created_at;
};
exports.IndicatorProgressBreakdown = IndicatorProgressBreakdown;
__decorate([
    (0, typeorm_1.PrimaryColumn)({ type: 'uuid', name: 'progress_id' }),
    __metadata("design:type", String)
], IndicatorProgressBreakdown.prototype, "progress_id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => indicator_progress_entity_js_1.IndicatorProgress, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'progress_id' }),
    __metadata("design:type", indicator_progress_entity_js_1.IndicatorProgress)
], IndicatorProgressBreakdown.prototype, "progress", void 0);
__decorate([
    (0, typeorm_1.PrimaryColumn)({ type: 'varchar', length: 40 }),
    __metadata("design:type", String)
], IndicatorProgressBreakdown.prototype, "axis", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb' }),
    __metadata("design:type", Object)
], IndicatorProgressBreakdown.prototype, "value_breakdown", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ type: 'timestamptz' }),
    __metadata("design:type", Date)
], IndicatorProgressBreakdown.prototype, "created_at", void 0);
exports.IndicatorProgressBreakdown = IndicatorProgressBreakdown = __decorate([
    (0, typeorm_1.Entity)('indicator_progress_breakdowns'),
    (0, typeorm_1.Index)('indicator_progress_breakdowns_axis_idx', ['axis'])
], IndicatorProgressBreakdown);
//# sourceMappingURL=indicator-progress-breakdown.entity.js.map