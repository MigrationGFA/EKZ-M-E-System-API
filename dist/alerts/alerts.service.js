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
exports.AlertsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const alert_entity_js_1 = require("./alert.entity.js");
const mail_service_js_1 = require("../mail/mail.service.js");
let AlertsService = class AlertsService {
    alertRepo;
    mailService;
    constructor(alertRepo, mailService) {
        this.alertRepo = alertRepo;
        this.mailService = mailService;
    }
    async findAll(filters) {
        const qb = this.alertRepo.createQueryBuilder('a');
        if (filters.user_id) {
            qb.andWhere('a.user_id = :userId', { userId: filters.user_id });
        }
        if (filters.unread_only) {
            qb.andWhere('a.is_read = false');
        }
        if (filters.type) {
            qb.andWhere('a.type = :type', { type: filters.type });
        }
        const total = await qb.getCount();
        if (filters.page && filters.per_page) {
            qb.skip((filters.page - 1) * filters.per_page).take(filters.per_page);
        }
        qb.orderBy('a.created_at', 'DESC');
        const alerts = await qb.getMany();
        return {
            data: alerts.map((a) => this.serialize(a)),
            total,
            page: filters.page ?? 1,
            per_page: filters.per_page ?? total,
        };
    }
    async create(dto) {
        const alert = this.alertRepo.create({
            user_id: dto.user_id,
            title: dto.title,
            description: dto.description,
            type: dto.type,
        });
        const saved = await this.alertRepo.save(alert);
        if (dto.sendEmail !== false) {
            void this.mailService.sendAlertNotification(dto.user_email, dto.title, dto.description, dto.type);
        }
        return this.serialize(saved);
    }
    async hasRecentAlert(filters) {
        const count = await this.alertRepo
            .createQueryBuilder('a')
            .where('a.user_id = :userId', { userId: filters.user_id })
            .andWhere('a.type = :type', { type: filters.type })
            .andWhere('a.title LIKE :prefix', { prefix: `${filters.title_prefix}%` })
            .andWhere('a.created_at > :since', { since: filters.since })
            .limit(1)
            .getCount();
        return count > 0;
    }
    async markRead(id) {
        const alert = await this.alertRepo.findOne({ where: { id } });
        if (!alert)
            throw new common_1.NotFoundException('Alert not found');
        alert.is_read = true;
        await this.alertRepo.save(alert);
        return { success: true };
    }
    async markAllRead(userId) {
        await this.alertRepo
            .createQueryBuilder()
            .update(alert_entity_js_1.Alert)
            .set({ is_read: true })
            .where('user_id = :userId AND is_read = false', { userId })
            .execute();
        return { success: true };
    }
    serialize(a) {
        return {
            id: a.id,
            title: a.title,
            description: a.description,
            type: a.type,
            isRead: a.is_read,
            timestamp: a.created_at,
        };
    }
};
exports.AlertsService = AlertsService;
exports.AlertsService = AlertsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(alert_entity_js_1.Alert)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        mail_service_js_1.MailService])
], AlertsService);
//# sourceMappingURL=alerts.service.js.map