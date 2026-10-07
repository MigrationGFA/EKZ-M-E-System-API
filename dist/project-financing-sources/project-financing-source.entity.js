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
exports.ProjectFinancingSource = void 0;
const typeorm_1 = require("typeorm");
const project_meta_entity_js_1 = require("../project-meta/project-meta.entity.js");
let ProjectFinancingSource = class ProjectFinancingSource {
    id;
    project_meta_id;
    project_meta;
    source_name;
    instrument;
    total_approved_ua;
    disbursed_ua;
    order;
    created_at;
    updated_at;
};
exports.ProjectFinancingSource = ProjectFinancingSource;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], ProjectFinancingSource.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid' }),
    __metadata("design:type", String)
], ProjectFinancingSource.prototype, "project_meta_id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => project_meta_entity_js_1.ProjectMeta, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'project_meta_id' }),
    __metadata("design:type", project_meta_entity_js_1.ProjectMeta)
], ProjectFinancingSource.prototype, "project_meta", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 255 }),
    __metadata("design:type", String)
], ProjectFinancingSource.prototype, "source_name", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 50 }),
    __metadata("design:type", String)
], ProjectFinancingSource.prototype, "instrument", void 0);
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
], ProjectFinancingSource.prototype, "total_approved_ua", void 0);
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
], ProjectFinancingSource.prototype, "disbursed_ua", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', default: 0 }),
    __metadata("design:type", Number)
], ProjectFinancingSource.prototype, "order", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ type: 'timestamptz' }),
    __metadata("design:type", Date)
], ProjectFinancingSource.prototype, "created_at", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ type: 'timestamptz' }),
    __metadata("design:type", Date)
], ProjectFinancingSource.prototype, "updated_at", void 0);
exports.ProjectFinancingSource = ProjectFinancingSource = __decorate([
    (0, typeorm_1.Entity)('project_financing_sources')
], ProjectFinancingSource);
//# sourceMappingURL=project-financing-source.entity.js.map