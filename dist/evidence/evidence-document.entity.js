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
exports.EvidenceDocument = void 0;
const typeorm_1 = require("typeorm");
const user_entity_js_1 = require("../users/user.entity.js");
const indicator_entity_js_1 = require("../indicators/indicator.entity.js");
const indicator_progress_entity_js_1 = require("../indicators/indicator-progress.entity.js");
const project_location_entity_js_1 = require("../locations/project-location.entity.js");
let EvidenceDocument = class EvidenceDocument {
    id;
    title;
    description;
    document_type;
    type_metadata;
    reference_period_from;
    reference_period_to;
    retention_until;
    file_url;
    file_size_bytes;
    mime_type;
    sha256;
    uploaded_by;
    uploader;
    uploaded_at;
    updated_at;
    deleted_at;
    supersedes_id;
    supersedes;
    indicator_id;
    indicator;
    indicator_progress_id;
    indicator_progress;
    location_id;
    location;
};
exports.EvidenceDocument = EvidenceDocument;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], EvidenceDocument.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 500 }),
    __metadata("design:type", String)
], EvidenceDocument.prototype, "title", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", Object)
], EvidenceDocument.prototype, "description", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 50 }),
    __metadata("design:type", String)
], EvidenceDocument.prototype, "document_type", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', default: () => "'{}'::jsonb" }),
    __metadata("design:type", Object)
], EvidenceDocument.prototype, "type_metadata", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'date', nullable: true }),
    __metadata("design:type", Object)
], EvidenceDocument.prototype, "reference_period_from", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'date', nullable: true }),
    __metadata("design:type", Object)
], EvidenceDocument.prototype, "reference_period_to", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamptz', nullable: true }),
    __metadata("design:type", Object)
], EvidenceDocument.prototype, "retention_until", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text' }),
    __metadata("design:type", String)
], EvidenceDocument.prototype, "file_url", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'bigint' }),
    __metadata("design:type", String)
], EvidenceDocument.prototype, "file_size_bytes", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 100 }),
    __metadata("design:type", String)
], EvidenceDocument.prototype, "mime_type", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 64 }),
    __metadata("design:type", String)
], EvidenceDocument.prototype, "sha256", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid' }),
    __metadata("design:type", String)
], EvidenceDocument.prototype, "uploaded_by", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_js_1.User),
    (0, typeorm_1.JoinColumn)({ name: 'uploaded_by' }),
    __metadata("design:type", user_entity_js_1.User)
], EvidenceDocument.prototype, "uploader", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'uploaded_at', type: 'timestamptz' }),
    __metadata("design:type", Date)
], EvidenceDocument.prototype, "uploaded_at", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ type: 'timestamptz' }),
    __metadata("design:type", Date)
], EvidenceDocument.prototype, "updated_at", void 0);
__decorate([
    (0, typeorm_1.DeleteDateColumn)({ type: 'timestamptz', nullable: true }),
    __metadata("design:type", Object)
], EvidenceDocument.prototype, "deleted_at", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', nullable: true }),
    __metadata("design:type", Object)
], EvidenceDocument.prototype, "supersedes_id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => EvidenceDocument, { nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: 'supersedes_id' }),
    __metadata("design:type", Object)
], EvidenceDocument.prototype, "supersedes", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', nullable: true }),
    __metadata("design:type", Object)
], EvidenceDocument.prototype, "indicator_id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => indicator_entity_js_1.Indicator, { nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: 'indicator_id' }),
    __metadata("design:type", Object)
], EvidenceDocument.prototype, "indicator", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', nullable: true }),
    __metadata("design:type", Object)
], EvidenceDocument.prototype, "indicator_progress_id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => indicator_progress_entity_js_1.IndicatorProgress, { nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: 'indicator_progress_id' }),
    __metadata("design:type", Object)
], EvidenceDocument.prototype, "indicator_progress", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', nullable: true }),
    __metadata("design:type", Object)
], EvidenceDocument.prototype, "location_id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => project_location_entity_js_1.ProjectLocation, { nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: 'location_id' }),
    __metadata("design:type", Object)
], EvidenceDocument.prototype, "location", void 0);
exports.EvidenceDocument = EvidenceDocument = __decorate([
    (0, typeorm_1.Entity)('evidence_documents')
], EvidenceDocument);
//# sourceMappingURL=evidence-document.entity.js.map