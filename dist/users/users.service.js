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
exports.UsersService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const bcrypt = __importStar(require("bcrypt"));
const user_entity_js_1 = require("./user.entity.js");
const user_role_enum_js_1 = require("../common/enums/user-role.enum.js");
const mail_service_js_1 = require("../mail/mail.service.js");
function getDefaultPassword() {
    const value = process.env.DEFAULT_USER_PASSWORD;
    if (!value) {
        throw new Error('DEFAULT_USER_PASSWORD is not set. Configure it in your environment before creating or resetting users.');
    }
    return value;
}
let UsersService = class UsersService {
    usersRepo;
    mailService;
    constructor(usersRepo, mailService) {
        this.usersRepo = usersRepo;
        this.mailService = mailService;
    }
    async findByEmail(email) {
        return this.usersRepo.findOne({ where: { email } });
    }
    async findById(id) {
        return this.usersRepo.findOne({ where: { id } });
    }
    async findAdminAndMeStaff() {
        return this.usersRepo.find({
            where: [
                { role: user_role_enum_js_1.UserRole.ADMIN, active: true },
                { role: user_role_enum_js_1.UserRole.ME_STAFF, active: true },
            ],
            select: ['id', 'email', 'name', 'role'],
        });
    }
    async updateLastLogin(id) {
        await this.usersRepo.update(id, { last_login: new Date() });
    }
    async findAll(filters) {
        const qb = this.usersRepo
            .createQueryBuilder('u')
            .select([
            'u.id',
            'u.email',
            'u.name',
            'u.role',
            'u.avatar',
            'u.active',
            'u.is_default_password',
            'u.last_login',
            'u.created_at',
            'u.updated_at',
        ]);
        if (filters.role) {
            qb.andWhere('u.role = :role', { role: filters.role });
        }
        if (filters.search) {
            qb.andWhere('(u.name ILIKE :search OR u.email ILIKE :search)', {
                search: `%${filters.search}%`,
            });
        }
        const total = await qb.getCount();
        if (filters.page && filters.per_page) {
            qb.skip((filters.page - 1) * filters.per_page).take(filters.per_page);
        }
        qb.orderBy('u.created_at', 'DESC');
        const users = await qb.getMany();
        const counts = await this.usersRepo.manager.query(`SELECT officer_id, COUNT(*)::int as count
       FROM submissions
       GROUP BY officer_id`);
        const countMap = new Map();
        for (const row of counts) {
            countMap.set(row.officer_id, row.count);
        }
        const data = users.map((u) => ({
            id: u.id,
            email: u.email,
            name: u.name,
            role: u.role,
            avatar: u.avatar,
            active: u.active,
            is_default_password: u.is_default_password,
            lastLogin: u.last_login,
            createdAt: u.created_at,
            submission_count: countMap.get(u.id) ?? 0,
        }));
        return {
            data,
            total,
            page: filters.page ?? 1,
            per_page: filters.per_page ?? total,
        };
    }
    async invite(name, email, role) {
        const existing = await this.findByEmail(email);
        if (existing) {
            throw new common_1.ConflictException(`Email ${email} already exists`);
        }
        const defaultPassword = getDefaultPassword();
        const hash = await bcrypt.hash(defaultPassword, 10);
        const user = this.usersRepo.create({
            name,
            email,
            password_hash: hash,
            role: role,
            is_default_password: true,
        });
        await this.usersRepo.save(user);
        void this.mailService.sendWelcome(email, name, defaultPassword);
        return { message: `User ${email} created successfully` };
    }
    async resetPassword(id) {
        const user = await this.usersRepo.findOne({ where: { id } });
        if (!user)
            throw new common_1.NotFoundException('User not found');
        const defaultPassword = getDefaultPassword();
        const hash = await bcrypt.hash(defaultPassword, 10);
        user.password_hash = hash;
        user.is_default_password = true;
        await this.usersRepo.save(user);
        void this.mailService.sendPasswordReset(user.email, user.name, defaultPassword);
        return { message: 'Password reset to default', userName: user.name };
    }
    async reactivate(id) {
        const user = await this.usersRepo.findOne({ where: { id } });
        if (!user)
            throw new common_1.NotFoundException('User not found');
        user.active = true;
        const saved = await this.usersRepo.save(user);
        void this.mailService.sendAccountReactivated(saved.email, saved.name);
        return this.serializeUser(saved);
    }
    async updateRole(id, role, requestingUserId) {
        if (id === requestingUserId) {
            throw new common_1.BadRequestException('You cannot change your own role');
        }
        const user = await this.usersRepo.findOne({ where: { id } });
        if (!user)
            throw new common_1.NotFoundException('User not found');
        const oldRole = user.role;
        user.role = role;
        const saved = await this.usersRepo.save(user);
        void this.mailService.sendRoleChanged(saved.email, saved.name, oldRole, role);
        return {
            user: this.serializeUser(saved),
            oldRole,
        };
    }
    async deactivate(id, requestingUserId) {
        if (id === requestingUserId) {
            throw new common_1.BadRequestException('You cannot deactivate your own account');
        }
        const user = await this.usersRepo.findOne({ where: { id } });
        if (!user)
            throw new common_1.NotFoundException('User not found');
        if (user.role === user_role_enum_js_1.UserRole.ADMIN) {
            const activeAdminCount = await this.usersRepo.countBy({
                role: user_role_enum_js_1.UserRole.ADMIN,
                active: true,
            });
            if (activeAdminCount <= 1) {
                throw new common_1.BadRequestException('Cannot deactivate the last active admin');
            }
        }
        user.active = false;
        const saved = await this.usersRepo.save(user);
        void this.mailService.sendAccountDeactivated(saved.email, saved.name);
        return this.serializeUser(saved);
    }
    serializeUser(u) {
        return {
            id: u.id,
            email: u.email,
            name: u.name,
            role: u.role,
            avatar: u.avatar,
            active: u.active,
            is_default_password: u.is_default_password,
            lastLogin: u.last_login,
            createdAt: u.created_at,
        };
    }
};
exports.UsersService = UsersService;
exports.UsersService = UsersService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(user_entity_js_1.User)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        mail_service_js_1.MailService])
], UsersService);
//# sourceMappingURL=users.service.js.map