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
exports.ApiTokensService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const crypto_1 = require("crypto");
const bcrypt = __importStar(require("bcrypt"));
const api_token_entity_js_1 = require("./api-token.entity.js");
const users_service_js_1 = require("../users/users.service.js");
const mail_service_js_1 = require("../mail/mail.service.js");
const audit_service_js_1 = require("../audit/audit.service.js");
let ApiTokensService = class ApiTokensService {
    tokenRepo;
    usersService;
    mailService;
    auditService;
    constructor(tokenRepo, usersService, mailService, auditService) {
        this.tokenRepo = tokenRepo;
        this.usersService = usersService;
        this.mailService = mailService;
        this.auditService = auditService;
    }
    async findAll() {
        const tokens = await this.tokenRepo.find({
            order: { created_at: 'DESC' },
        });
        return tokens.map((t) => ({
            id: t.id,
            name: t.name,
            tokenPart: t.token_prefix,
            createdAt: t.created_at,
        }));
    }
    async create(name, actorId, actorName) {
        const rawToken = 'ekz_LIVE_' + (0, crypto_1.randomBytes)(16).toString('hex');
        const tokenPrefix = rawToken.substring(0, 14) + '****...' + rawToken.slice(-3);
        const tokenHash = await bcrypt.hash(rawToken, 10);
        const token = this.tokenRepo.create({
            name,
            token_hash: tokenHash,
            token_prefix: tokenPrefix,
        });
        const saved = await this.tokenRepo.save(token);
        void this.auditService.log({
            user_id: actorId,
            user_name: actorName,
            action: 'create',
            resource: 'api_token',
            resource_id: saved.id,
            after_data: { name, tokenPrefix },
        });
        void this.notifyAdmins((emails) => this.mailService.sendTokenCreated(emails, name, saved.token_prefix));
        return {
            id: saved.id,
            name: saved.name,
            tokenPart: saved.token_prefix,
            createdAt: saved.created_at,
            rawToken,
        };
    }
    async remove(id, actorId, actorName) {
        const token = await this.tokenRepo.findOne({ where: { id } });
        if (!token)
            throw new common_1.NotFoundException('Token not found');
        await this.tokenRepo.remove(token);
        void this.auditService.log({
            user_id: actorId,
            user_name: actorName,
            action: 'delete',
            resource: 'api_token',
            resource_id: id,
            before_data: { name: token.name },
        });
        void this.notifyAdmins((emails) => this.mailService.sendTokenRevoked(emails, token.name));
        return { success: true };
    }
    async notifyAdmins(send) {
        const admins = await this.usersService.findAdminAndMeStaff();
        const emails = admins.map((u) => u.email);
        if (emails.length > 0) {
            send(emails);
        }
    }
};
exports.ApiTokensService = ApiTokensService;
exports.ApiTokensService = ApiTokensService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(api_token_entity_js_1.ApiToken)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        users_service_js_1.UsersService,
        mail_service_js_1.MailService,
        audit_service_js_1.AuditService])
], ApiTokensService);
//# sourceMappingURL=api-tokens.service.js.map