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
exports.AuthController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const throttler_1 = require("@nestjs/throttler");
const auth_service_js_1 = require("./auth.service.js");
const users_service_js_1 = require("../users/users.service.js");
const login_dto_js_1 = require("./dto/login.dto.js");
const change_password_dto_js_1 = require("./dto/change-password.dto.js");
const forgot_password_dto_js_1 = require("./dto/forgot-password.dto.js");
const reset_password_dto_js_1 = require("./dto/reset-password.dto.js");
const public_decorator_js_1 = require("./public.decorator.js");
let AuthController = class AuthController {
    authService;
    usersService;
    constructor(authService, usersService) {
        this.authService = authService;
        this.usersService = usersService;
    }
    async login(dto) {
        return this.authService.login(dto.email, dto.password);
    }
    async getMe(req) {
        const user = await this.usersService.findById(req.user.id);
        if (!user)
            throw new common_1.UnauthorizedException('User not found');
        return {
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role,
                avatar: user.avatar,
                is_default_password: user.is_default_password,
            },
        };
    }
    async forgotPassword(dto) {
        await this.authService.forgotPassword(dto.email);
        return {
            message: 'If that email is registered, a password reset link has been sent.',
        };
    }
    async resetPassword(dto) {
        await this.authService.resetPasswordWithToken(dto.token, dto.new_password);
        return { message: 'Password has been reset. You can now log in.' };
    }
    async changePassword(req, dto) {
        return this.authService.changePassword(req.user.id, dto.current_password, dto.new_password);
    }
};
exports.AuthController = AuthController;
__decorate([
    (0, public_decorator_js_1.Public)(),
    (0, common_1.Post)('login'),
    (0, throttler_1.Throttle)({ default: { ttl: 60000, limit: 5 } }),
    (0, swagger_1.ApiOperation)({ summary: 'Login and obtain a JWT access token' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Returns user profile and JWT token. is_default_password is true if the user has never changed their password.',
    }),
    (0, swagger_1.ApiResponse)({
        status: 401,
        description: 'Invalid credentials or deactivated account',
    }),
    (0, swagger_1.ApiResponse)({
        status: 429,
        description: 'Too many login attempts — rate limit exceeded',
    }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Validation error' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [login_dto_js_1.LoginDto]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "login", null);
__decorate([
    (0, common_1.Get)('me'),
    (0, swagger_1.ApiBearerAuth)('JWT'),
    (0, swagger_1.ApiOperation)({ summary: 'Get current authenticated user' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Returns the current user profile' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Missing or invalid token' }),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "getMe", null);
__decorate([
    (0, public_decorator_js_1.Public)(),
    (0, common_1.Post)('forgot-password'),
    (0, throttler_1.Throttle)({ default: { ttl: 60000, limit: 3 } }),
    (0, swagger_1.ApiOperation)({ summary: 'Request a password reset link via email' }),
    (0, swagger_1.ApiResponse)({
        status: 201,
        description: 'Always returns success to prevent user enumeration',
    }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Validation error' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [forgot_password_dto_js_1.ForgotPasswordDto]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "forgotPassword", null);
__decorate([
    (0, public_decorator_js_1.Public)(),
    (0, common_1.Post)('reset-password'),
    (0, swagger_1.ApiOperation)({
        summary: 'Reset password using the token from the email link',
    }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Password reset successfully' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Invalid or expired token' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [reset_password_dto_js_1.ResetPasswordDto]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "resetPassword", null);
__decorate([
    (0, common_1.Post)('change-password'),
    (0, swagger_1.ApiBearerAuth)('JWT'),
    (0, swagger_1.ApiOperation)({
        summary: 'Change own password',
        description: 'Authenticated users change their own password. Sets is_default_password to false on success.',
    }),
    (0, swagger_1.ApiResponse)({
        status: 201,
        description: '{ message: "Password updated successfully" }',
    }),
    (0, swagger_1.ApiResponse)({
        status: 401,
        description: 'Current password is incorrect',
    }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Validation error' }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, change_password_dto_js_1.ChangePasswordDto]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "changePassword", null);
exports.AuthController = AuthController = __decorate([
    (0, swagger_1.ApiTags)('Auth'),
    (0, common_1.Controller)('auth'),
    __metadata("design:paramtypes", [auth_service_js_1.AuthService,
        users_service_js_1.UsersService])
], AuthController);
//# sourceMappingURL=auth.controller.js.map