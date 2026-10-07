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
exports.AuditController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const audit_service_js_1 = require("./audit.service.js");
const create_audit_dto_js_1 = require("./dto/create-audit.dto.js");
const roles_decorator_js_1 = require("../auth/roles.decorator.js");
const user_role_enum_js_1 = require("../common/enums/user-role.enum.js");
let AuditController = class AuditController {
    auditService;
    constructor(auditService) {
        this.auditService = auditService;
    }
    findAll(user_id, action, resource, resource_id, from, to, page, per_page) {
        return this.auditService.findAll({
            user_id,
            action,
            resource,
            resource_id,
            from,
            to,
            page: page ? Number(page) : undefined,
            per_page: per_page ? Number(per_page) : undefined,
        });
    }
    create(dto) {
        return this.auditService.create({
            user_id: dto.user_id,
            user_name: dto.user_name,
            action: dto.action,
            resource: dto.resource,
            resource_id: dto.resource_id,
            before_data: dto.before ?? null,
            after_data: dto.after ?? null,
        });
    }
};
exports.AuditController = AuditController;
__decorate([
    (0, common_1.Get)(),
    (0, roles_decorator_js_1.Roles)(user_role_enum_js_1.UserRole.ADMIN),
    (0, swagger_1.ApiOperation)({
        summary: 'List audit log entries (admin only)',
        description: 'Returns newest first. Fields: before/after (not before_data/after_data), timestamp.',
    }),
    (0, swagger_1.ApiQuery)({ name: 'user_id', required: false }),
    (0, swagger_1.ApiQuery)({
        name: 'action',
        required: false,
        enum: ['create', 'update', 'delete', 'login', 'logout', 'submit'],
    }),
    (0, swagger_1.ApiQuery)({ name: 'resource', required: false, example: 'indicator' }),
    (0, swagger_1.ApiQuery)({
        name: 'resource_id',
        required: false,
        description: 'Scope to a single resource — e.g. on the indicator detail page Audit tab.',
    }),
    (0, swagger_1.ApiQuery)({
        name: 'from',
        required: false,
        description: 'ISO date filter start',
    }),
    (0, swagger_1.ApiQuery)({ name: 'to', required: false, description: 'ISO date filter end' }),
    (0, swagger_1.ApiQuery)({ name: 'page', required: false, type: Number }),
    (0, swagger_1.ApiQuery)({ name: 'per_page', required: false, type: Number }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Plain array of audit entries' }),
    (0, swagger_1.ApiResponse)({ status: 403, description: 'Admin only' }),
    __param(0, (0, common_1.Query)('user_id')),
    __param(1, (0, common_1.Query)('action')),
    __param(2, (0, common_1.Query)('resource')),
    __param(3, (0, common_1.Query)('resource_id')),
    __param(4, (0, common_1.Query)('from')),
    __param(5, (0, common_1.Query)('to')),
    __param(6, (0, common_1.Query)('page')),
    __param(7, (0, common_1.Query)('per_page')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String, String, String, String, String]),
    __metadata("design:returntype", void 0)
], AuditController.prototype, "findAll", null);
__decorate([
    (0, common_1.Post)(),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    (0, swagger_1.ApiOperation)({
        summary: 'Write an audit log entry',
        description: 'All authenticated roles can write entries. The backend also writes entries server-side for sensitive operations.',
    }),
    (0, swagger_1.ApiResponse)({
        status: 201,
        description: 'Created audit entry with id and timestamp',
    }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_audit_dto_js_1.CreateAuditDto]),
    __metadata("design:returntype", void 0)
], AuditController.prototype, "create", null);
exports.AuditController = AuditController = __decorate([
    (0, swagger_1.ApiTags)('Audit Log'),
    (0, swagger_1.ApiBearerAuth)('JWT'),
    (0, common_1.Controller)('audit-log'),
    __metadata("design:paramtypes", [audit_service_js_1.AuditService])
], AuditController);
//# sourceMappingURL=audit.controller.js.map