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
exports.ReportsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const reports_service_js_1 = require("./reports.service.js");
const generate_report_dto_js_1 = require("./dto/generate-report.dto.js");
const report_preview_query_dto_js_1 = require("./dto/report-preview-query.dto.js");
const roles_decorator_js_1 = require("../auth/roles.decorator.js");
const user_role_enum_js_1 = require("../common/enums/user-role.enum.js");
const users_service_js_1 = require("../users/users.service.js");
let ReportsController = class ReportsController {
    reportsService;
    usersService;
    constructor(reportsService, usersService) {
        this.reportsService = reportsService;
        this.usersService = usersService;
    }
    findAll() {
        return this.reportsService.findAll();
    }
    async preview(query, req) {
        const requestingUser = await this.usersService.findById(req.user.id);
        const generatedBy = requestingUser?.name ?? req.user.email;
        return this.reportsService.getPreviewData(generatedBy, query.date_from, query.date_to);
    }
    async generate(dto, req) {
        const filters = {};
        if (dto.indicator_ids)
            filters.indicator_ids = dto.indicator_ids;
        if (dto.logframe_level_id)
            filters.logframe_level_id = dto.logframe_level_id;
        if (dto.location_id)
            filters.location_id = dto.location_id;
        if (dto.date_from)
            filters.date_from = dto.date_from;
        if (dto.date_to)
            filters.date_to = dto.date_to;
        if (dto.year !== undefined)
            filters.year = dto.year;
        if (dto.quarter !== undefined)
            filters.quarter = dto.quarter;
        const requestingUser = await this.usersService.findById(req.user.id);
        const generatedBy = requestingUser?.name ?? req.user.email;
        const generatorEmail = requestingUser?.email ?? req.user.email;
        return this.reportsService.generate(dto.title, dto.format, generatedBy, filters, generatorEmail, req.user.id);
    }
};
exports.ReportsController = ReportsController;
__decorate([
    (0, common_1.Get)(),
    (0, roles_decorator_js_1.Roles)(user_role_enum_js_1.UserRole.ADMIN, user_role_enum_js_1.UserRole.ME_STAFF, user_role_enum_js_1.UserRole.PROGRAMME_STAFF, user_role_enum_js_1.UserRole.VIEWER),
    (0, swagger_1.ApiOperation)({ summary: 'List all report metadata records' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Plain array of report objects' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], ReportsController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('preview'),
    (0, roles_decorator_js_1.Roles)(user_role_enum_js_1.UserRole.ADMIN, user_role_enum_js_1.UserRole.ME_STAFF),
    (0, swagger_1.ApiOperation)({
        summary: 'Aggregate all data needed to generate a full AfDB-grade M&E report',
        description: 'Returns executive summary KPIs, logframe rows with nested indicators and trend data, ' +
            'submissions breakdown per indicator, and data quality metrics. ' +
            'Accepts optional date_from / date_to to scope the reporting period.',
    }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'ReportPreviewData object' }),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [report_preview_query_dto_js_1.ReportPreviewQueryDto, Object]),
    __metadata("design:returntype", Promise)
], ReportsController.prototype, "preview", null);
__decorate([
    (0, common_1.Post)('generate'),
    (0, roles_decorator_js_1.Roles)(user_role_enum_js_1.UserRole.ADMIN, user_role_enum_js_1.UserRole.ME_STAFF),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    (0, swagger_1.ApiOperation)({
        summary: 'Generate a report and record its metadata',
        description: 'When format=pdf, renders the AfDB supervision PDF server-side, uploads to Azure Blob (container `wiftdocuments`, key prefix `reports/`), and returns the public download URL. When format=excel, only metadata is recorded — the client handles XLSX export.',
    }),
    (0, swagger_1.ApiResponse)({
        status: 201,
        description: '{ report_id, download_url, format }',
    }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [generate_report_dto_js_1.GenerateReportDto, Object]),
    __metadata("design:returntype", Promise)
], ReportsController.prototype, "generate", null);
exports.ReportsController = ReportsController = __decorate([
    (0, swagger_1.ApiTags)('Reports'),
    (0, swagger_1.ApiBearerAuth)('JWT'),
    (0, common_1.Controller)('reports'),
    __metadata("design:paramtypes", [reports_service_js_1.ReportsService,
        users_service_js_1.UsersService])
], ReportsController);
//# sourceMappingURL=reports.controller.js.map