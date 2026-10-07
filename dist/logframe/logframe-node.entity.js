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
exports.LogframeNode = void 0;
const typeorm_1 = require("typeorm");
let LogframeNode = class LogframeNode {
    id;
    logframe_id;
    type;
    code;
    title;
    description;
    parent_id;
    parent;
    children;
    order;
    budget_usd;
    budget_currency;
    created_at;
    updated_at;
};
exports.LogframeNode = LogframeNode;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], LogframeNode.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 50, default: 'lf_1' }),
    __metadata("design:type", String)
], LogframeNode.prototype, "logframe_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 20 }),
    __metadata("design:type", String)
], LogframeNode.prototype, "type", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 50 }),
    __metadata("design:type", String)
], LogframeNode.prototype, "code", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text' }),
    __metadata("design:type", String)
], LogframeNode.prototype, "title", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", Object)
], LogframeNode.prototype, "description", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', nullable: true }),
    __metadata("design:type", Object)
], LogframeNode.prototype, "parent_id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => LogframeNode, (node) => node.children, {
        onDelete: 'RESTRICT',
        nullable: true,
    }),
    (0, typeorm_1.JoinColumn)({ name: 'parent_id' }),
    __metadata("design:type", Object)
], LogframeNode.prototype, "parent", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => LogframeNode, (node) => node.parent),
    __metadata("design:type", Array)
], LogframeNode.prototype, "children", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', default: 0 }),
    __metadata("design:type", Number)
], LogframeNode.prototype, "order", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'numeric',
        nullable: true,
        transformer: {
            to: (v) => v,
            from: (v) => (v === null ? null : Number(v)),
        },
    }),
    __metadata("design:type", Object)
], LogframeNode.prototype, "budget_usd", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 10, default: 'USD' }),
    __metadata("design:type", String)
], LogframeNode.prototype, "budget_currency", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ type: 'timestamptz' }),
    __metadata("design:type", Date)
], LogframeNode.prototype, "created_at", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ type: 'timestamptz' }),
    __metadata("design:type", Date)
], LogframeNode.prototype, "updated_at", void 0);
exports.LogframeNode = LogframeNode = __decorate([
    (0, typeorm_1.Entity)('logframe_nodes')
], LogframeNode);
//# sourceMappingURL=logframe-node.entity.js.map