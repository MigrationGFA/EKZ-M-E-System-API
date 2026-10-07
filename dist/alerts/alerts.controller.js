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
exports.AlertsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const alerts_service_js_1 = require("./alerts.service.js");
const roles_decorator_js_1 = require("../auth/roles.decorator.js");
const user_role_enum_js_1 = require("../common/enums/user-role.enum.js");
let AlertsController = class AlertsController {
    alertsService;
    constructor(alertsService) {
        this.alertsService = alertsService;
    }
    findAll(req, unread_only, type, page, per_page) {
        return this.alertsService.findAll({
            user_id: req.user.id,
            unread_only: unread_only === 'true',
            type,
            page: page ? Number(page) : undefined,
            per_page: per_page ? Number(per_page) : undefined,
        });
    }
    markAllRead(req) {
        return this.alertsService.markAllRead(req.user.id);
    }
    markRead(id) {
        return this.alertsService.markRead(id);
    }
};
exports.AlertsController = AlertsController;
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({
        summary: 'List alerts for the requesting user',
        description: 'Returns only alerts belonging to the authenticated user, newest first.',
    }),
    (0, swagger_1.ApiQuery)({ name: 'unread_only', required: false, type: Boolean }),
    (0, swagger_1.ApiQuery)({
        name: 'type',
        required: false,
        enum: ['deadline', 'missed_target', 'data_flag', 'sync_success', 'system'],
    }),
    (0, swagger_1.ApiQuery)({ name: 'page', required: false, type: Number }),
    (0, swagger_1.ApiQuery)({ name: 'per_page', required: false, type: Number }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Plain array of alert objects (isRead, timestamp fields)',
    }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Query)('unread_only')),
    __param(2, (0, common_1.Query)('type')),
    __param(3, (0, common_1.Query)('page')),
    __param(4, (0, common_1.Query)('per_page')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String, String, String]),
    __metadata("design:returntype", void 0)
], AlertsController.prototype, "findAll", null);
__decorate([
    (0, common_1.Post)('readAll'),
    (0, swagger_1.ApiOperation)({ summary: 'Mark all alerts as read for the requesting user' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: '{ success: true }' }),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], AlertsController.prototype, "markAllRead", null);
__decorate([
    (0, common_1.Post)(':id/read'),
    (0, swagger_1.ApiOperation)({ summary: 'Mark a single alert as read' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Alert UUID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: '{ success: true }' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Alert not found' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], AlertsController.prototype, "markRead", null);
exports.AlertsController = AlertsController = __decorate([
    (0, swagger_1.ApiTags)('Alerts'),
    (0, swagger_1.ApiBearerAuth)('JWT'),
    (0, common_1.Controller)('alerts'),
    (0, roles_decorator_js_1.Roles)(user_role_enum_js_1.UserRole.ADMIN, user_role_enum_js_1.UserRole.ME_STAFF, user_role_enum_js_1.UserRole.PROGRAMME_STAFF, user_role_enum_js_1.UserRole.VIEWER),
    __metadata("design:paramtypes", [alerts_service_js_1.AlertsService])
], AlertsController);
//# sourceMappingURL=alerts.controller.js.map