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
exports.SubmissionsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const submissions_service_js_1 = require("./submissions.service.js");
const create_submission_dto_js_1 = require("./dto/create-submission.dto.js");
const validate_submission_dto_js_1 = require("./dto/validate-submission.dto.js");
const roles_decorator_js_1 = require("../auth/roles.decorator.js");
const user_role_enum_js_1 = require("../common/enums/user-role.enum.js");
const jwt_or_api_token_guard_js_1 = require("../auth/jwt-or-api-token.guard.js");
let SubmissionsController = class SubmissionsController {
    submissionsService;
    constructor(submissionsService) {
        this.submissionsService = submissionsService;
    }
    findAll(form_id, officer_id, validation_status, page, per_page) {
        return this.submissionsService.findAll({
            form_id,
            officer_id,
            validation_status,
            page: page ? Number(page) : undefined,
            per_page: per_page ? Number(per_page) : undefined,
        });
    }
    findOne(id) {
        return this.submissionsService.findOne(id);
    }
    createBatch(dtos, req) {
        return this.submissionsService.createBatch(dtos, req.user.id, req.user.email);
    }
    create(dto, req) {
        return this.submissionsService.create(dto, req.user.id, req.user.email);
    }
    validate(id, dto, req) {
        return this.submissionsService.validate(id, dto.action, dto.comment, req.user.id, req.user.email);
    }
};
exports.SubmissionsController = SubmissionsController;
__decorate([
    (0, common_1.Get)(),
    (0, roles_decorator_js_1.Roles)(user_role_enum_js_1.UserRole.ADMIN, user_role_enum_js_1.UserRole.ME_STAFF, user_role_enum_js_1.UserRole.PROGRAMME_STAFF),
    (0, swagger_1.ApiOperation)({ summary: 'List submissions' }),
    (0, swagger_1.ApiQuery)({ name: 'form_id', required: false }),
    (0, swagger_1.ApiQuery)({ name: 'officer_id', required: false }),
    (0, swagger_1.ApiQuery)({
        name: 'validation_status',
        required: false,
        enum: ['pending', 'approved', 'rejected'],
    }),
    (0, swagger_1.ApiQuery)({ name: 'page', required: false, type: Number }),
    (0, swagger_1.ApiQuery)({ name: 'per_page', required: false, type: Number }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Plain array of submission objects',
    }),
    __param(0, (0, common_1.Query)('form_id')),
    __param(1, (0, common_1.Query)('officer_id')),
    __param(2, (0, common_1.Query)('validation_status')),
    __param(3, (0, common_1.Query)('page')),
    __param(4, (0, common_1.Query)('per_page')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String, String]),
    __metadata("design:returntype", void 0)
], SubmissionsController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, roles_decorator_js_1.Roles)(user_role_enum_js_1.UserRole.ADMIN, user_role_enum_js_1.UserRole.ME_STAFF, user_role_enum_js_1.UserRole.PROGRAMME_STAFF),
    (0, swagger_1.ApiOperation)({ summary: 'Get a single submission by ID' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Submission UUID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Submission object' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Submission not found' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], SubmissionsController.prototype, "findOne", null);
__decorate([
    (0, common_1.Post)('batch'),
    (0, common_1.UseGuards)(jwt_or_api_token_guard_js_1.JwtOrApiTokenGuard),
    (0, roles_decorator_js_1.Roles)(user_role_enum_js_1.UserRole.ADMIN, user_role_enum_js_1.UserRole.ME_STAFF, user_role_enum_js_1.UserRole.PROGRAMME_STAFF),
    (0, swagger_1.ApiOperation)({
        summary: 'Batch submit multiple submissions',
        description: 'Processes each submission independently. Duplicates are silently accepted (idempotent). Geofencing runs on each accepted submission.',
    }),
    (0, swagger_1.ApiBody)({ type: [create_submission_dto_js_1.CreateSubmissionDto] }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: '{ accepted: string[], rejected: { id, reason }[] }',
    }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Array, Object]),
    __metadata("design:returntype", void 0)
], SubmissionsController.prototype, "createBatch", null);
__decorate([
    (0, common_1.Post)(),
    (0, common_1.UseGuards)(jwt_or_api_token_guard_js_1.JwtOrApiTokenGuard),
    (0, roles_decorator_js_1.Roles)(user_role_enum_js_1.UserRole.ADMIN, user_role_enum_js_1.UserRole.ME_STAFF, user_role_enum_js_1.UserRole.PROGRAMME_STAFF),
    (0, swagger_1.ApiOperation)({
        summary: 'Submit a single submission',
        description: 'The id field is client-generated (UUID v4). Returns 409 if id already exists. Geofencing runs server-side.',
    }),
    (0, swagger_1.ApiResponse)({ status: 201, description: '{ id, status: "accepted" }' }),
    (0, swagger_1.ApiResponse)({
        status: 409,
        description: 'Submission with this ID already exists',
    }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_submission_dto_js_1.CreateSubmissionDto, Object]),
    __metadata("design:returntype", void 0)
], SubmissionsController.prototype, "create", null);
__decorate([
    (0, common_1.Put)(':id/validate'),
    (0, roles_decorator_js_1.Roles)(user_role_enum_js_1.UserRole.ADMIN, user_role_enum_js_1.UserRole.ME_STAFF),
    (0, swagger_1.ApiOperation)({ summary: 'Approve or reject a submission' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Submission UUID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Full updated submission object' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Submission not found' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, validate_submission_dto_js_1.ValidateSubmissionDto, Object]),
    __metadata("design:returntype", void 0)
], SubmissionsController.prototype, "validate", null);
exports.SubmissionsController = SubmissionsController = __decorate([
    (0, swagger_1.ApiTags)('Submissions'),
    (0, swagger_1.ApiBearerAuth)('JWT'),
    (0, common_1.Controller)('submissions'),
    __metadata("design:paramtypes", [submissions_service_js_1.SubmissionsService])
], SubmissionsController);
//# sourceMappingURL=submissions.controller.js.map