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
exports.IndicatorProgress = void 0;
const typeorm_1 = require("typeorm");
const indicator_entity_js_1 = require("./indicator.entity.js");
let IndicatorProgress = class IndicatorProgress {
    id;
    indicator_id;
    indicator;
    value;
    date;
    notes;
    submitted_by;
    created_at;
};
exports.IndicatorProgress = IndicatorProgress;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], IndicatorProgress.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid' }),
    __metadata("design:type", String)
], IndicatorProgress.prototype, "indicator_id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => indicator_entity_js_1.Indicator, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'indicator_id' }),
    __metadata("design:type", indicator_entity_js_1.Indicator)
], IndicatorProgress.prototype, "indicator", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'numeric' }),
    __metadata("design:type", Number)
], IndicatorProgress.prototype, "value", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamptz' }),
    __metadata("design:type", Date)
], IndicatorProgress.prototype, "date", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", Object)
], IndicatorProgress.prototype, "notes", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 255 }),
    __metadata("design:type", String)
], IndicatorProgress.prototype, "submitted_by", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ type: 'timestamptz' }),
    __metadata("design:type", Date)
], IndicatorProgress.prototype, "created_at", void 0);
exports.IndicatorProgress = IndicatorProgress = __decorate([
    (0, typeorm_1.Entity)('indicator_progress')
], IndicatorProgress);
//# sourceMappingURL=indicator-progress.entity.js.map