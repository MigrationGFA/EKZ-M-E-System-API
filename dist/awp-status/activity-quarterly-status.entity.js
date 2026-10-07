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
exports.ActivityQuarterlyStatus = void 0;
const typeorm_1 = require("typeorm");
const logframe_node_entity_js_1 = require("../logframe/logframe-node.entity.js");
let ActivityQuarterlyStatus = class ActivityQuarterlyStatus {
    id;
    logframe_node_id;
    logframe_node;
    year;
    quarter;
    status;
    pct_achievement;
    comments;
    planned_for_next_qtr;
    deadline;
    created_at;
    updated_at;
};
exports.ActivityQuarterlyStatus = ActivityQuarterlyStatus;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], ActivityQuarterlyStatus.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid' }),
    __metadata("design:type", String)
], ActivityQuarterlyStatus.prototype, "logframe_node_id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => logframe_node_entity_js_1.LogframeNode, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'logframe_node_id' }),
    __metadata("design:type", logframe_node_entity_js_1.LogframeNode)
], ActivityQuarterlyStatus.prototype, "logframe_node", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int' }),
    __metadata("design:type", Number)
], ActivityQuarterlyStatus.prototype, "year", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int' }),
    __metadata("design:type", Number)
], ActivityQuarterlyStatus.prototype, "quarter", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 20, default: 'pending_initiation' }),
    __metadata("design:type", String)
], ActivityQuarterlyStatus.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', default: 0 }),
    __metadata("design:type", Number)
], ActivityQuarterlyStatus.prototype, "pct_achievement", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', default: '' }),
    __metadata("design:type", String)
], ActivityQuarterlyStatus.prototype, "comments", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'boolean', default: false }),
    __metadata("design:type", Boolean)
], ActivityQuarterlyStatus.prototype, "planned_for_next_qtr", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'date', nullable: true }),
    __metadata("design:type", Object)
], ActivityQuarterlyStatus.prototype, "deadline", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ type: 'timestamptz' }),
    __metadata("design:type", Date)
], ActivityQuarterlyStatus.prototype, "created_at", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ type: 'timestamptz' }),
    __metadata("design:type", Date)
], ActivityQuarterlyStatus.prototype, "updated_at", void 0);
exports.ActivityQuarterlyStatus = ActivityQuarterlyStatus = __decorate([
    (0, typeorm_1.Entity)('activity_quarterly_status'),
    (0, typeorm_1.Index)('aqs_node_year_quarter_uniq', ['logframe_node_id', 'year', 'quarter'], {
        unique: true,
    })
], ActivityQuarterlyStatus);
//# sourceMappingURL=activity-quarterly-status.entity.js.map