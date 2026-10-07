"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const node_crypto_1 = require("node:crypto");
const jwt_1 = require("@nestjs/jwt");
const bcrypt = __importStar(require("bcrypt"));
const users_service_js_1 = require("../users/users.service.js");
const audit_service_js_1 = require("../audit/audit.service.js");
const mail_service_js_1 = require("../mail/mail.service.js");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const user_entity_js_1 = require("../users/user.entity.js");
let AuthService = class AuthService {
    usersService;
    jwtService;
    auditService;
    mailService;
    usersRepo;
    constructor(usersService, jwtService, auditService, mailService, usersRepo) {
        this.usersService = usersService;
        this.jwtService = jwtService;
        this.auditService = auditService;
        this.mailService = mailService;
        this.usersRepo = usersRepo;
    }
    async login(email, password) {
        const user = await this.usersService.findByEmail(email);
        if (!user)
            throw new common_1.UnauthorizedException('Invalid credentials');
        const passwordValid = await bcrypt.compare(password, user.password_hash);
        if (!passwordValid)
            throw new common_1.UnauthorizedException('Invalid credentials');
        if (!user.active)
            throw new common_1.UnauthorizedException('Account is deactivated');
        await this.usersService.updateLastLogin(user.id);
        void this.auditService.log({
            user_id: user.id,
            user_name: user.name,
            action: 'login',
            resource: 'user',
            resource_id: user.id,
        });
        const payload = { sub: user.id, email: user.email, role: user.role };
        const token = this.jwtService.sign(payload);
        return {
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role,
                avatar: user.avatar,
                is_default_password: user.is_default_password,
            },
            token,
        };
    }
    async changePassword(userId, currentPassword, newPassword) {
        const user = await this.usersRepo.findOne({ where: { id: userId } });
        if (!user)
            throw new common_1.UnauthorizedException('User not found');
        const valid = await bcrypt.compare(currentPassword, user.password_hash);
        if (!valid)
            throw new common_1.UnauthorizedException('Current password is incorrect');
        user.password_hash = await bcrypt.hash(newPassword, 10);
        user.is_default_password = false;
        await this.usersRepo.save(user);
        void this.mailService.sendPasswordChanged(user.email, user.name);
        void this.auditService.log({
            user_id: user.id,
            user_name: user.name,
            action: 'update',
            resource: 'user',
            resource_id: user.id,
            after_data: { is_default_password: false },
        });
        return { message: 'Password updated successfully' };
    }
    async forgotPassword(email) {
        const user = await this.usersService.findByEmail(email);
        if (!user?.active)
            return;
        const rawToken = (0, node_crypto_1.randomBytes)(32).toString('hex');
        const tokenHash = (0, node_crypto_1.createHash)('sha256').update(rawToken).digest('hex');
        user.password_reset_token = tokenHash;
        user.password_reset_expires = new Date(Date.now() + 60 * 60 * 1000);
        await this.usersRepo.save(user);
        const frontendUrl = process.env.FRONTEND_URL ?? 'http://localhost:3001';
        const resetLink = `${frontendUrl}/reset-password?token=${rawToken}`;
        this.mailService.sendForgotPasswordLink(user.email, user.name, resetLink);
    }
    async resetPasswordWithToken(token, newPassword) {
        const tokenHash = (0, node_crypto_1.createHash)('sha256').update(token).digest('hex');
        const user = await this.usersRepo.findOne({
            where: { password_reset_token: tokenHash },
        });
        if (!user?.password_reset_expires ||
            user.password_reset_expires < new Date()) {
            throw new common_1.BadRequestException('Password reset link is invalid or has expired');
        }
        user.password_hash = await bcrypt.hash(newPassword, 10);
        user.is_default_password = false;
        user.password_reset_token = null;
        user.password_reset_expires = null;
        await this.usersRepo.save(user);
        this.mailService.sendPasswordChanged(user.email, user.name);
        void this.auditService.log({
            user_id: user.id,
            user_name: user.name,
            action: 'update',
            resource: 'user',
            resource_id: user.id,
            after_data: { password_reset: true },
        });
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __param(4, (0, typeorm_1.InjectRepository)(user_entity_js_1.User)),
    __metadata("design:paramtypes", [users_service_js_1.UsersService,
        jwt_1.JwtService,
        audit_service_js_1.AuditService,
        mail_service_js_1.MailService,
        typeorm_2.Repository])
], AuthService);
//# sourceMappingURL=auth.service.js.map