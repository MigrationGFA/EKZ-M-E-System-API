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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BeneficiariesController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const beneficiaries_service_js_1 = require("./beneficiaries.service.js");
const create_beneficiary_dto_js_1 = require("./dto/create-beneficiary.dto.js");
const update_beneficiary_dto_js_1 = require("./dto/update-beneficiary.dto.js");
const beneficiary_query_dto_js_1 = require("./dto/beneficiary-query.dto.js");
const batch_beneficiary_dto_js_1 = require("./dto/batch-beneficiary.dto.js");
const attach_cohort_dto_js_1 = require("./dto/attach-cohort.dto.js");
const roles_decorator_js_1 = require("../auth/roles.decorator.js");
const user_role_enum_js_1 = require("../common/enums/user-role.enum.js");
let BeneficiariesController = class BeneficiariesController {
    service;
    constructor(service) {
        this.service = service;
    }
    findAll(query, req) {
        return this.service.findAll(query, req.user);
    }
    lookup(phone, hash, req) {
        return this.service.lookup(req.user, { phone, hash });
    }
    findOne(id, req) {
        return this.service.findOne(id, req.user, req);
    }
    create(dto, req) {
        return this.service.create(dto, req.user, req);
    }
    batch(dto, req) {
        return this.service.batchCreate(dto.items, req.user);
    }
    update(id, dto, req) {
        return this.service.update(id, dto, req.user, req);
    }
    softDelete(id, req) {
        return this.service.softDelete(id, req.user, req);
    }
    attachCohort(id, dto, req) {
        return this.service.attachCohort(id, dto.code, req.user);
    }
    detachCohort(id, code, req) {
        return this.service.detachCohort(id, code, req.user);
    }
};
exports.BeneficiariesController = BeneficiariesController;
__decorate([
    (0, common_1.Get)(),
    (0, roles_decorator_js_1.Roles)(user_role_enum_js_1.UserRole.ADMIN, user_role_enum_js_1.UserRole.ME_STAFF, user_role_enum_js_1.UserRole.PROGRAMME_STAFF),
    (0, swagger_1.ApiOperation)({
        summary: 'List beneficiaries',
        description: 'Always redacts phone/NIN/notes per ADR 0006 §70. Programme staff see their own registrations only.',
    }),
    (0, swagger_1.ApiQuery)({ name: 'q', required: false }),
    (0, swagger_1.ApiQuery)({ name: 'community', required: false }),
    (0, swagger_1.ApiQuery)({ name: 'cohort', required: false }),
    (0, swagger_1.ApiQuery)({ name: 'include_inactive', required: false }),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [beneficiary_query_dto_js_1.BeneficiaryQueryDto, Object]),
    __metadata("design:returntype", void 0)
], BeneficiariesController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('lookup'),
    (0, roles_decorator_js_1.Roles)(user_role_enum_js_1.UserRole.ADMIN, user_role_enum_js_1.UserRole.ME_STAFF, user_role_enum_js_1.UserRole.PROGRAMME_STAFF),
    (0, swagger_1.ApiOperation)({
        summary: 'Autocomplete lookup by phone or NIN hash',
        description: 'Returns redacted lookup hits for the BeneficiaryPicker. Always PII-free.',
    }),
    (0, swagger_1.ApiQuery)({ name: 'phone', required: false, description: 'E.164 phone' }),
    (0, swagger_1.ApiQuery)({
        name: 'hash',
        required: false,
        description: 'SHA-256 of salt+NIN',
    }),
    __param(0, (0, common_1.Query)('phone')),
    __param(1, (0, common_1.Query)('hash')),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, Object]),
    __metadata("design:returntype", void 0)
], BeneficiariesController.prototype, "lookup", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, roles_decorator_js_1.Roles)(user_role_enum_js_1.UserRole.ADMIN, user_role_enum_js_1.UserRole.ME_STAFF, user_role_enum_js_1.UserRole.PROGRAMME_STAFF),
    (0, swagger_1.ApiOperation)({
        summary: 'Get one beneficiary',
        description: 'Audited PII read. Programme staff only see their own registrations.',
    }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Beneficiary UUID' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], BeneficiariesController.prototype, "findOne", null);
__decorate([
    (0, common_1.Post)(),
    (0, roles_decorator_js_1.Roles)(user_role_enum_js_1.UserRole.ADMIN, user_role_enum_js_1.UserRole.ME_STAFF, user_role_enum_js_1.UserRole.PROGRAMME_STAFF),
    (0, swagger_1.ApiOperation)({ summary: 'Register a beneficiary' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Created' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_beneficiary_dto_js_1.CreateBeneficiaryDto, Object]),
    __metadata("design:returntype", void 0)
], BeneficiariesController.prototype, "create", null);
__decorate([
    (0, common_1.Post)('batch'),
    (0, roles_decorator_js_1.Roles)(user_role_enum_js_1.UserRole.ADMIN, user_role_enum_js_1.UserRole.ME_STAFF, user_role_enum_js_1.UserRole.PROGRAMME_STAFF),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({
        summary: 'Batch register (offline sync)',
        description: 'Drains the offline registration queue. Returns accepted + rejected ids; idempotent on existing ids.',
    }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [batch_beneficiary_dto_js_1.BatchBeneficiaryDto, Object]),
    __metadata("design:returntype", Promise)
], BeneficiariesController.prototype, "batch", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, roles_decorator_js_1.Roles)(user_role_enum_js_1.UserRole.ADMIN, user_role_enum_js_1.UserRole.ME_STAFF, user_role_enum_js_1.UserRole.PROGRAMME_STAFF),
    (0, swagger_1.ApiOperation)({ summary: 'Update a beneficiary' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_beneficiary_dto_js_1.UpdateBeneficiaryDto, Object]),
    __metadata("design:returntype", void 0)
], BeneficiariesController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, roles_decorator_js_1.Roles)(user_role_enum_js_1.UserRole.ADMIN, user_role_enum_js_1.UserRole.ME_STAFF),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({
        summary: 'Soft-delete a beneficiary',
        description: 'Sets active = false. Record survives for audit (ADR §69).',
    }),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], BeneficiariesController.prototype, "softDelete", null);
__decorate([
    (0, common_1.Post)(':id/cohorts'),
    (0, roles_decorator_js_1.Roles)(user_role_enum_js_1.UserRole.ADMIN, user_role_enum_js_1.UserRole.ME_STAFF),
    (0, swagger_1.ApiOperation)({ summary: 'Attach a cohort tag' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, attach_cohort_dto_js_1.AttachCohortDto, Object]),
    __metadata("design:returntype", void 0)
], BeneficiariesController.prototype, "attachCohort", null);
__decorate([
    (0, common_1.Delete)(':id/cohorts/:code'),
    (0, roles_decorator_js_1.Roles)(user_role_enum_js_1.UserRole.ADMIN, user_role_enum_js_1.UserRole.ME_STAFF),
    (0, swagger_1.ApiOperation)({ summary: 'Detach a cohort tag' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Param)('code')),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", void 0)
], BeneficiariesController.prototype, "detachCohort", null);
exports.BeneficiariesController = BeneficiariesController = __decorate([
    (0, swagger_1.ApiTags)('Beneficiaries'),
    (0, swagger_1.ApiBearerAuth)('JWT'),
    (0, common_1.Controller)('beneficiaries'),
    __metadata("design:paramtypes", [beneficiaries_service_js_1.BeneficiariesService])
], BeneficiariesController);
//# sourceMappingURL=beneficiaries.controller.js.map