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
exports.Submission = void 0;
const typeorm_1 = require("typeorm");
const form_entity_js_1 = require("../forms/form.entity.js");
const user_entity_js_1 = require("../users/user.entity.js");
const project_location_entity_js_1 = require("../locations/project-location.entity.js");
const beneficiary_entity_js_1 = require("../beneficiaries/beneficiary.entity.js");
let Submission = class Submission {
    id;
    form_id;
    form;
    officer_id;
    officer;
    data;
    location;
    location_id;
    project_location;
    on_site;
    beneficiary_id;
    beneficiary;
    submitted_at;
    validation_status;
    validation_comment;
    synced_at;
};
exports.Submission = Submission;
__decorate([
    (0, typeorm_1.PrimaryColumn)('uuid'),
    __metadata("design:type", String)
], Submission.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid' }),
    __metadata("design:type", String)
], Submission.prototype, "form_id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => form_entity_js_1.Form),
    (0, typeorm_1.JoinColumn)({ name: 'form_id' }),
    __metadata("design:type", form_entity_js_1.Form)
], Submission.prototype, "form", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid' }),
    __metadata("design:type", String)
], Submission.prototype, "officer_id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_js_1.User),
    (0, typeorm_1.JoinColumn)({ name: 'officer_id' }),
    __metadata("design:type", user_entity_js_1.User)
], Submission.prototype, "officer", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb' }),
    __metadata("design:type", Object)
], Submission.prototype, "data", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', nullable: true }),
    __metadata("design:type", Object)
], Submission.prototype, "location", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', nullable: true }),
    __metadata("design:type", Object)
], Submission.prototype, "location_id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => project_location_entity_js_1.ProjectLocation, { nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: 'location_id' }),
    __metadata("design:type", Object)
], Submission.prototype, "project_location", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'boolean', nullable: true }),
    __metadata("design:type", Object)
], Submission.prototype, "on_site", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', nullable: true }),
    __metadata("design:type", Object)
], Submission.prototype, "beneficiary_id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => beneficiary_entity_js_1.Beneficiary, { nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: 'beneficiary_id' }),
    __metadata("design:type", Object)
], Submission.prototype, "beneficiary", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamptz' }),
    __metadata("design:type", Date)
], Submission.prototype, "submitted_at", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 20, default: 'pending' }),
    __metadata("design:type", String)
], Submission.prototype, "validation_status", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", Object)
], Submission.prototype, "validation_comment", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ type: 'timestamptz' }),
    __metadata("design:type", Date)
], Submission.prototype, "synced_at", void 0);
exports.Submission = Submission = __decorate([
    (0, typeorm_1.Entity)('submissions')
], Submission);
//# sourceMappingURL=submission.entity.js.map