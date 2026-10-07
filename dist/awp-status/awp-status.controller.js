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
exports.AwpStatusController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const awp_status_service_js_1 = require("./awp-status.service.js");
const upsert_awp_status_dto_js_1 = require("./dto/upsert-awp-status.dto.js");
const roles_decorator_js_1 = require("../auth/roles.decorator.js");
const user_role_enum_js_1 = require("../common/enums/user-role.enum.js");
let AwpStatusController = class AwpStatusController {
    service;
    constructor(service) {
        this.service = service;
    }
    findByPeriod(year, quarter) {
        return this.service.findByPeriod(year, quarter);
    }
    upsert(nodeId, year, quarter, dto, req) {
        return this.service.upsert(nodeId, year, quarter, dto, req.user.id, req.user.email);
    }
};
exports.AwpStatusController = AwpStatusController;
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({
        summary: 'List AWP activity status rows for a given (year, quarter). Frontend joins with logframe activity nodes.',
    }),
    (0, swagger_1.ApiQuery)({ name: 'year', required: true, type: Number }),
    (0, swagger_1.ApiQuery)({ name: 'quarter', required: true, type: Number }),
    __param(0, (0, common_1.Query)('year', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Query)('quarter', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number]),
    __metadata("design:returntype", void 0)
], AwpStatusController.prototype, "findByPeriod", null);
__decorate([
    (0, common_1.Put)(':nodeId/:year/:quarter'),
    (0, roles_decorator_js_1.Roles)(user_role_enum_js_1.UserRole.ADMIN, user_role_enum_js_1.UserRole.ME_STAFF),
    (0, swagger_1.ApiOperation)({
        summary: 'Upsert AWP status for one (activity, year, quarter). Service rejects non-activity nodes with 422.',
    }),
    (0, swagger_1.ApiResponse)({
        status: 422,
        description: 'logframe node is not type=activity, or quarter out of range',
    }),
    __param(0, (0, common_1.Param)('nodeId', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Param)('year', common_1.ParseIntPipe)),
    __param(2, (0, common_1.Param)('quarter', common_1.ParseIntPipe)),
    __param(3, (0, common_1.Body)()),
    __param(4, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Number, Number, upsert_awp_status_dto_js_1.UpsertAwpStatusDto, Object]),
    __metadata("design:returntype", void 0)
], AwpStatusController.prototype, "upsert", null);
exports.AwpStatusController = AwpStatusController = __decorate([
    (0, swagger_1.ApiTags)('AWP Status'),
    (0, swagger_1.ApiBearerAuth)('JWT'),
    (0, common_1.Controller)('awp-status'),
    __metadata("design:paramtypes", [awp_status_service_js_1.AwpStatusService])
], AwpStatusController);
//# sourceMappingURL=awp-status.controller.js.map