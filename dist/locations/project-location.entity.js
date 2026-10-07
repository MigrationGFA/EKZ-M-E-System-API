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
exports.ProjectLocation = void 0;
const typeorm_1 = require("typeorm");
const user_entity_js_1 = require("../users/user.entity.js");
let ProjectLocation = class ProjectLocation {
    id;
    name;
    sector;
    description;
    lat;
    lng;
    radius_m;
    indicator_ids;
    created_by;
    creator;
    created_at;
    updated_at;
};
exports.ProjectLocation = ProjectLocation;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], ProjectLocation.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 255 }),
    __metadata("design:type", String)
], ProjectLocation.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 100 }),
    __metadata("design:type", String)
], ProjectLocation.prototype, "sector", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", Object)
], ProjectLocation.prototype, "description", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'double precision' }),
    __metadata("design:type", Number)
], ProjectLocation.prototype, "lat", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'double precision' }),
    __metadata("design:type", Number)
], ProjectLocation.prototype, "lng", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', default: 500 }),
    __metadata("design:type", Number)
], ProjectLocation.prototype, "radius_m", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', array: true, default: '{}' }),
    __metadata("design:type", Array)
], ProjectLocation.prototype, "indicator_ids", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid' }),
    __metadata("design:type", String)
], ProjectLocation.prototype, "created_by", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_js_1.User),
    (0, typeorm_1.JoinColumn)({ name: 'created_by' }),
    __metadata("design:type", user_entity_js_1.User)
], ProjectLocation.prototype, "creator", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ type: 'timestamptz' }),
    __metadata("design:type", Date)
], ProjectLocation.prototype, "created_at", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ type: 'timestamptz' }),
    __metadata("design:type", Date)
], ProjectLocation.prototype, "updated_at", void 0);
exports.ProjectLocation = ProjectLocation = __decorate([
    (0, typeorm_1.Entity)('project_locations')
], ProjectLocation);
//# sourceMappingURL=project-location.entity.js.map