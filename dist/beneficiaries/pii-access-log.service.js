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
var PiiAccessLogService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PiiAccessLogService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const pii_access_log_entity_js_1 = require("./pii-access-log.entity.js");
let PiiAccessLogService = PiiAccessLogService_1 = class PiiAccessLogService {
    repo;
    logger = new common_1.Logger(PiiAccessLogService_1.name);
    constructor(repo) {
        this.repo = repo;
    }
    async record(input) {
        try {
            const requestId = input.request?.headers?.['x-request-id'];
            const userAgent = input.request?.headers?.['user-agent'];
            const entry = this.repo.create({
                user_id: input.actor.id,
                user_email: input.actor.email,
                beneficiary_id: input.beneficiary_id,
                action: input.action,
                reason: input.reason ?? null,
                request_id: typeof requestId === 'string' ? requestId : null,
                ip_address: input.request?.ip ?? null,
                user_agent: typeof userAgent === 'string' ? userAgent : null,
            });
            await this.repo.save(entry);
        }
        catch (err) {
            this.logger.error(`Failed to write pii_access_log for ${input.action} on ${input.beneficiary_id ?? '<none>'}: ${err.message}`);
        }
    }
};
exports.PiiAccessLogService = PiiAccessLogService;
exports.PiiAccessLogService = PiiAccessLogService = PiiAccessLogService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(pii_access_log_entity_js_1.PiiAccessLog)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], PiiAccessLogService);
//# sourceMappingURL=pii-access-log.service.js.map