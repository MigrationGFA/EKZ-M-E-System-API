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
exports.Indicator = void 0;
const typeorm_1 = require("typeorm");
const logframe_node_entity_js_1 = require("../logframe/logframe-node.entity.js");
let Indicator = class Indicator {
    id;
    code;
    name;
    description;
    level;
    kind;
    unit;
    baseline;
    target;
    current_value;
    status;
    frequency;
    methodology;
    rmf_adoa;
    target_mode;
    data_source_type;
    reporting_year_start;
    reporting_year_end;
    logframe_level_id;
    logframe_node;
    sdg_ids;
    responsible_party;
    means_of_verification;
    created_at;
    updated_at;
};
exports.Indicator = Indicator;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], Indicator.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 50 }),
    __metadata("design:type", String)
], Indicator.prototype, "code", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 500 }),
    __metadata("design:type", String)
], Indicator.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text' }),
    __metadata("design:type", String)
], Indicator.prototype, "description", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 20 }),
    __metadata("design:type", String)
], Indicator.prototype, "level", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 30, default: 'output' }),
    __metadata("design:type", String)
], Indicator.prototype, "kind", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 100 }),
    __metadata("design:type", String)
], Indicator.prototype, "unit", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'numeric', default: 0 }),
    __metadata("design:type", Number)
], Indicator.prototype, "baseline", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'numeric' }),
    __metadata("design:type", Number)
], Indicator.prototype, "target", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'numeric', default: 0 }),
    __metadata("design:type", Number)
], Indicator.prototype, "current_value", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 20 }),
    __metadata("design:type", String)
], Indicator.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 20 }),
    __metadata("design:type", String)
], Indicator.prototype, "frequency", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", Object)
], Indicator.prototype, "methodology", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'boolean', default: false }),
    __metadata("design:type", Boolean)
], Indicator.prototype, "rmf_adoa", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 20, default: 'cumulative' }),
    __metadata("design:type", String)
], Indicator.prototype, "target_mode", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 30, default: 'form_submission' }),
    __metadata("design:type", String)
], Indicator.prototype, "data_source_type", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', nullable: true }),
    __metadata("design:type", Object)
], Indicator.prototype, "reporting_year_start", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', nullable: true }),
    __metadata("design:type", Object)
], Indicator.prototype, "reporting_year_end", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', nullable: true }),
    __metadata("design:type", Object)
], Indicator.prototype, "logframe_level_id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => logframe_node_entity_js_1.LogframeNode, { onDelete: 'SET NULL', nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: 'logframe_level_id' }),
    __metadata("design:type", Object)
], Indicator.prototype, "logframe_node", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', array: true, default: '{}' }),
    __metadata("design:type", Array)
], Indicator.prototype, "sdg_ids", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 255 }),
    __metadata("design:type", String)
], Indicator.prototype, "responsible_party", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text' }),
    __metadata("design:type", String)
], Indicator.prototype, "means_of_verification", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ type: 'timestamptz' }),
    __metadata("design:type", Date)
], Indicator.prototype, "created_at", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ type: 'timestamptz' }),
    __metadata("design:type", Date)
], Indicator.prototype, "updated_at", void 0);
exports.Indicator = Indicator = __decorate([
    (0, typeorm_1.Entity)('indicators'),
    (0, typeorm_1.Index)('indicators_code_kind_uniq', ['code', 'kind'], { unique: true })
], Indicator);
//# sourceMappingURL=indicator.entity.js.map