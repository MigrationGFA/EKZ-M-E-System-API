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
exports.QuarterlyReportsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const quarterly_reports_service_js_1 = require("./quarterly-reports.service.js");
const upsert_quarterly_report_dto_js_1 = require("./dto/upsert-quarterly-report.dto.js");
const roles_decorator_js_1 = require("../auth/roles.decorator.js");
const user_role_enum_js_1 = require("../common/enums/user-role.enum.js");
let QuarterlyReportsController = class QuarterlyReportsController {
    service;
    constructor(service) {
        this.service = service;
    }
    async findOrCreate(year, quarter, req) {
        return this.service.getOrCreate(year, quarter, req.user.id, req.user.email);
    }
    upsert(year, quarter, dto, req) {
        return this.service.upsert(year, quarter, dto, req.user.id, req.user.email);
    }
};
exports.QuarterlyReportsController = QuarterlyReportsController;
__decorate([
    (0, common_1.Get)(':year/:quarter'),
    (0, swagger_1.ApiOperation)({
        summary: 'Get the QPR narrative row for (year, quarter). Auto-creates a blank row if missing.',
    }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'QPR narrative row' }),
    (0, swagger_1.ApiResponse)({
        status: 422,
        description: 'quarter must be 1-4',
    }),
    __param(0, (0, common_1.Param)('year', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Param)('quarter', common_1.ParseIntPipe)),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number, Object]),
    __metadata("design:returntype", Promise)
], QuarterlyReportsController.prototype, "findOrCreate", null);
__decorate([
    (0, common_1.Put)(':year/:quarter'),
    (0, roles_decorator_js_1.Roles)(user_role_enum_js_1.UserRole.ADMIN, user_role_enum_js_1.UserRole.ME_STAFF),
    (0, swagger_1.ApiOperation)({
        summary: 'Upsert the QPR narrative row for (year, quarter). UPSERT — re-running with the same period updates in place.',
    }),
    __param(0, (0, common_1.Param)('year', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Param)('quarter', common_1.ParseIntPipe)),
    __param(2, (0, common_1.Body)()),
    __param(3, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number, upsert_quarterly_report_dto_js_1.UpsertQuarterlyReportDto, Object]),
    __metadata("design:returntype", void 0)
], QuarterlyReportsController.prototype, "upsert", null);
exports.QuarterlyReportsController = QuarterlyReportsController = __decorate([
    (0, swagger_1.ApiTags)('Quarterly Reports'),
    (0, swagger_1.ApiBearerAuth)('JWT'),
    (0, common_1.Controller)('quarterly-reports'),
    __metadata("design:paramtypes", [quarterly_reports_service_js_1.QuarterlyReportsService])
], QuarterlyReportsController);
//# sourceMappingURL=quarterly-reports.controller.js.map