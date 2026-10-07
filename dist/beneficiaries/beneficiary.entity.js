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
exports.Beneficiary = void 0;
const typeorm_1 = require("typeorm");
const user_entity_js_1 = require("../users/user.entity.js");
const cohort_entity_js_1 = require("./cohort.entity.js");
let Beneficiary = class Beneficiary {
    id;
    full_name;
    sex;
    date_of_birth;
    age_band;
    community;
    household_id;
    phone_e164;
    national_id_hash;
    skill_level;
    disability_status;
    notes;
    consent_given;
    consent_date;
    consent_method;
    active;
    withdrawn_at;
    created_by;
    creator;
    cohorts;
    created_at;
    updated_at;
};
exports.Beneficiary = Beneficiary;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], Beneficiary.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 255 }),
    __metadata("design:type", String)
], Beneficiary.prototype, "full_name", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 10 }),
    __metadata("design:type", String)
], Beneficiary.prototype, "sex", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'date', nullable: true }),
    __metadata("design:type", Object)
], Beneficiary.prototype, "date_of_birth", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 20, nullable: true }),
    __metadata("design:type", Object)
], Beneficiary.prototype, "age_band", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 255, nullable: true }),
    __metadata("design:type", Object)
], Beneficiary.prototype, "community", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 100, nullable: true }),
    __metadata("design:type", Object)
], Beneficiary.prototype, "household_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 20, nullable: true }),
    __metadata("design:type", Object)
], Beneficiary.prototype, "phone_e164", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 64, nullable: true }),
    __metadata("design:type", Object)
], Beneficiary.prototype, "national_id_hash", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 40, nullable: true }),
    __metadata("design:type", Object)
], Beneficiary.prototype, "skill_level", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'boolean', default: false }),
    __metadata("design:type", Boolean)
], Beneficiary.prototype, "disability_status", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", Object)
], Beneficiary.prototype, "notes", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'boolean', default: false }),
    __metadata("design:type", Boolean)
], Beneficiary.prototype, "consent_given", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamptz', nullable: true }),
    __metadata("design:type", Object)
], Beneficiary.prototype, "consent_date", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 50, nullable: true }),
    __metadata("design:type", Object)
], Beneficiary.prototype, "consent_method", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'boolean', default: true }),
    __metadata("design:type", Boolean)
], Beneficiary.prototype, "active", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamptz', nullable: true }),
    __metadata("design:type", Object)
], Beneficiary.prototype, "withdrawn_at", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid' }),
    __metadata("design:type", String)
], Beneficiary.prototype, "created_by", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_js_1.User),
    (0, typeorm_1.JoinColumn)({ name: 'created_by' }),
    __metadata("design:type", user_entity_js_1.User)
], Beneficiary.prototype, "creator", void 0);
__decorate([
    (0, typeorm_1.ManyToMany)(() => cohort_entity_js_1.Cohort),
    (0, typeorm_1.JoinTable)({
        name: 'beneficiary_cohorts',
        joinColumn: { name: 'beneficiary_id', referencedColumnName: 'id' },
        inverseJoinColumn: { name: 'cohort_id', referencedColumnName: 'id' },
    }),
    __metadata("design:type", Array)
], Beneficiary.prototype, "cohorts", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ type: 'timestamptz' }),
    __metadata("design:type", Date)
], Beneficiary.prototype, "created_at", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ type: 'timestamptz' }),
    __metadata("design:type", Date)
], Beneficiary.prototype, "updated_at", void 0);
exports.Beneficiary = Beneficiary = __decorate([
    (0, typeorm_1.Entity)('beneficiaries')
], Beneficiary);
//# sourceMappingURL=beneficiary.entity.js.map