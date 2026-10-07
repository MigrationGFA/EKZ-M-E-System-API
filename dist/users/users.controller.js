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
exports.UsersController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const users_service_js_1 = require("./users.service.js");
const invite_user_dto_js_1 = require("./dto/invite-user.dto.js");
const update_role_dto_js_1 = require("./dto/update-role.dto.js");
const audit_service_js_1 = require("../audit/audit.service.js");
const roles_decorator_js_1 = require("../auth/roles.decorator.js");
const user_role_enum_js_1 = require("../common/enums/user-role.enum.js");
let UsersController = class UsersController {
    usersService;
    auditService;
    constructor(usersService, auditService) {
        this.usersService = usersService;
        this.auditService = auditService;
    }
    findAll(role, search, page, per_page) {
        return this.usersService.findAll({
            role,
            search,
            page: page ? Number(page) : undefined,
            per_page: per_page ? Number(per_page) : undefined,
        });
    }
    async findOne(id) {
        const user = await this.usersService.findById(id);
        if (!user)
            throw new common_1.NotFoundException('User not found');
        return this.usersService.serializeUser(user);
    }
    invite(dto) {
        return this.usersService.invite(dto.name, dto.email, dto.role);
    }
    async updateRole(id, dto, req) {
        const result = await this.usersService.updateRole(id, dto.role, req.user.id);
        await this.auditService.log({
            user_id: id,
            user_name: result.user.name,
            action: 'update',
            resource: 'user',
            resource_id: id,
            before_data: { role: result.oldRole },
            after_data: { role: dto.role },
        });
        return result.user;
    }
    async deactivate(id, req) {
        const user = await this.usersService.deactivate(id, req.user.id);
        await this.auditService.log({
            user_id: id,
            user_name: user.name,
            action: 'update',
            resource: 'user',
            resource_id: id,
            before_data: { active: true },
            after_data: { active: false },
        });
        return user;
    }
    async reactivate(id) {
        const user = await this.usersService.reactivate(id);
        await this.auditService.log({
            user_id: id,
            user_name: user.name,
            action: 'update',
            resource: 'user',
            resource_id: id,
            before_data: { active: false },
            after_data: { active: true },
        });
        return user;
    }
    async resetPassword(id) {
        const result = await this.usersService.resetPassword(id);
        await this.auditService.log({
            user_id: id,
            user_name: result.userName,
            action: 'update',
            resource: 'user',
            resource_id: id,
            after_data: { is_default_password: true },
        });
        return { message: result.message };
    }
};
exports.UsersController = UsersController;
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({
        summary: 'List all users (admin only)',
        description: 'Never returns password_hash. Includes submission_count and is_default_password per user.',
    }),
    (0, swagger_1.ApiQuery)({
        name: 'role',
        required: false,
        enum: ['admin', 'me_staff', 'programme_staff', 'viewer'],
    }),
    (0, swagger_1.ApiQuery)({
        name: 'search',
        required: false,
        description: 'Search by name or email',
    }),
    (0, swagger_1.ApiQuery)({ name: 'page', required: false, type: Number }),
    (0, swagger_1.ApiQuery)({ name: 'per_page', required: false, type: Number }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Plain array of user objects with submission_count and is_default_password',
    }),
    (0, swagger_1.ApiResponse)({ status: 403, description: 'Admin only' }),
    __param(0, (0, common_1.Query)('role')),
    __param(1, (0, common_1.Query)('search')),
    __param(2, (0, common_1.Query)('page')),
    __param(3, (0, common_1.Query)('per_page')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String]),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Get a single user by ID (admin only)' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'User UUID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'User object' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'User not found' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "findOne", null);
__decorate([
    (0, common_1.Post)('invite'),
    (0, swagger_1.ApiOperation)({
        summary: 'Create a new user (admin only)',
        description: 'Creates user with the default password. is_default_password is set to true. Returns 409 if email already exists.',
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: '{ message: "User <email> created successfully" }',
    }),
    (0, swagger_1.ApiResponse)({ status: 409, description: 'Email already exists' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [invite_user_dto_js_1.InviteUserDto]),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "invite", null);
__decorate([
    (0, common_1.Put)(':id/role'),
    (0, swagger_1.ApiOperation)({
        summary: "Update a user's role",
        description: 'Writes an audit log entry for the role change.',
    }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'User UUID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Full updated user object' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'User not found' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_role_dto_js_1.UpdateRoleDto, Object]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "updateRole", null);
__decorate([
    (0, common_1.Put)(':id/deactivate'),
    (0, swagger_1.ApiOperation)({
        summary: 'Deactivate a user (admin only)',
        description: 'Deactivated users receive 401 on login. Writes an audit log entry.',
    }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'User UUID' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Full user object with active: false',
    }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'User not found' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "deactivate", null);
__decorate([
    (0, common_1.Put)(':id/reactivate'),
    (0, swagger_1.ApiOperation)({
        summary: 'Reactivate a deactivated user (admin only)',
        description: 'Sets active to true. Writes an audit log entry.',
    }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'User UUID' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Full user object with active: true',
    }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'User not found' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "reactivate", null);
__decorate([
    (0, common_1.Put)(':id/reset-password'),
    (0, swagger_1.ApiOperation)({
        summary: 'Reset a user password to default (admin only)',
        description: 'Resets password to the system default and sets is_default_password to true. Writes an audit log entry.',
    }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'User UUID' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: '{ message: "Password reset to default" }',
    }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'User not found' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "resetPassword", null);
exports.UsersController = UsersController = __decorate([
    (0, swagger_1.ApiTags)('Users'),
    (0, swagger_1.ApiBearerAuth)('JWT'),
    (0, common_1.Controller)('users'),
    (0, roles_decorator_js_1.Roles)(user_role_enum_js_1.UserRole.ADMIN),
    __metadata("design:paramtypes", [users_service_js_1.UsersService,
        audit_service_js_1.AuditService])
], UsersController);
//# sourceMappingURL=users.controller.js.map