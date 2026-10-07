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
exports.SafeguardMeasure = void 0;
const typeorm_1 = require("typeorm");
let SafeguardMeasure = class SafeguardMeasure {
    id;
    type;
    measure_name;
    total_count;
    not_started_count;
    ongoing_count;
    completed_count;
    budget_allocated_ua;
    amount_disbursed_ua;
    order;
    created_at;
    updated_at;
};
exports.SafeguardMeasure = SafeguardMeasure;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], SafeguardMeasure.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 20 }),
    __metadata("design:type", String)
], SafeguardMeasure.prototype, "type", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 255 }),
    __metadata("design:type", String)
], SafeguardMeasure.prototype, "measure_name", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', default: 0 }),
    __metadata("design:type", Number)
], SafeguardMeasure.prototype, "total_count", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', default: 0 }),
    __metadata("design:type", Number)
], SafeguardMeasure.prototype, "not_started_count", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', default: 0 }),
    __metadata("design:type", Number)
], SafeguardMeasure.prototype, "ongoing_count", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', default: 0 }),
    __metadata("design:type", Number)
], SafeguardMeasure.prototype, "completed_count", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'numeric',
        precision: 18,
        scale: 2,
        default: 0,
        transformer: {
            to: (v) => v,
            from: (v) => Number(v),
        },
    }),
    __metadata("design:type", Number)
], SafeguardMeasure.prototype, "budget_allocated_ua", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'numeric',
        precision: 18,
        scale: 2,
        default: 0,
        transformer: {
            to: (v) => v,
            from: (v) => Number(v),
        },
    }),
    __metadata("design:type", Number)
], SafeguardMeasure.prototype, "amount_disbursed_ua", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', default: 0 }),
    __metadata("design:type", Number)
], SafeguardMeasure.prototype, "order", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ type: 'timestamptz' }),
    __metadata("design:type", Date)
], SafeguardMeasure.prototype, "created_at", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ type: 'timestamptz' }),
    __metadata("design:type", Date)
], SafeguardMeasure.prototype, "updated_at", void 0);
exports.SafeguardMeasure = SafeguardMeasure = __decorate([
    (0, typeorm_1.Entity)('safeguard_measures')
], SafeguardMeasure);
//# sourceMappingURL=safeguard-measure.entity.js.map