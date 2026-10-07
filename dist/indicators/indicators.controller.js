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
exports.IndicatorsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const indicators_service_js_1 = require("./indicators.service.js");
const disaggregation_service_js_1 = require("./disaggregation.service.js");
const create_indicator_dto_js_1 = require("./dto/create-indicator.dto.js");
const update_indicator_dto_js_1 = require("./dto/update-indicator.dto.js");
const create_progress_dto_js_1 = require("./dto/create-progress.dto.js");
const find_indicators_query_dto_js_1 = require("./dto/find-indicators-query.dto.js");
const year_target_dto_js_1 = require("./dto/year-target.dto.js");
const disaggregation_dto_js_1 = require("./dto/disaggregation.dto.js");
const roles_decorator_js_1 = require("../auth/roles.decorator.js");
const jwt_or_api_token_guard_js_1 = require("../auth/jwt-or-api-token.guard.js");
const user_role_enum_js_1 = require("../common/enums/user-role.enum.js");
const data_source_js_1 = require("./constants/data-source.js");
let IndicatorsController = class IndicatorsController {
    indicatorsService;
    disaggregationService;
    constructor(indicatorsService, disaggregationService) {
        this.indicatorsService = indicatorsService;
        this.disaggregationService = disaggregationService;
    }
    findAll(query) {
        return this.indicatorsService.findAll({
            status: query.status,
            logframe_level_id: query.logframe_level_id,
            sdg_id: query.sdg_id ? Number(query.sdg_id) : undefined,
            frequency: query.frequency,
            kind: query.kind,
            rmf_adoa: query.rmf_adoa,
            data_source_type: query.data_source_type,
            search: query.search,
            page: query.page ? Number(query.page) : undefined,
            per_page: query.per_page ? Number(query.per_page) : undefined,
        });
    }
    findOne(id) {
        return this.indicatorsService.findOne(id);
    }
    getProgress(id, from, to) {
        return this.indicatorsService.getProgress(id, from, to);
    }
    async addProgress(id, dto, req) {
        const actor = req.user;
        if (actor.role === user_role_enum_js_1.UserRole.API_TOKEN) {
            const indicator = await this.indicatorsService.findOne(id);
            if ((0, data_source_js_1.isMappableDataSourceType)(indicator.data_source_type)) {
                throw new common_1.ForbiddenException({
                    message: `API tokens may only post progress against indicators whose data_source_type is external (got '${indicator.data_source_type}').`,
                    code: 'API_TOKEN_NOT_PERMITTED_FOR_INDICATOR',
                    indicator_id: id,
                    data_source_type: indicator.data_source_type,
                });
            }
        }
        return this.indicatorsService.addProgress(id, dto, actor.id, actor.email);
    }
    getLinkedForms(id) {
        return this.indicatorsService.getLinkedForms(id);
    }
    create(dto, req) {
        return this.indicatorsService.create(dto, req.user.id, req.user.email);
    }
    update(id, dto, req) {
        return this.indicatorsService.update(id, dto, req.user.id, req.user.email);
    }
    getYearTargets(id) {
        return this.indicatorsService.getYearTargets(id);
    }
    setYearTargets(id, dto, req) {
        return this.indicatorsService.setYearTargets(id, dto, req.user.id, req.user.email);
    }
    getDisaggregation(id) {
        return this.disaggregationService.getRules(id);
    }
    setDisaggregation(id, dto, req) {
        return this.disaggregationService.setRules(id, dto, req.user.id, req.user.email);
    }
    getDisaggregationRollup(id, query) {
        return this.disaggregationService.getRollup(id, query.axis);
    }
    remove(id, req) {
        return this.indicatorsService.remove(id, req.user.id, req.user.email);
    }
};
exports.IndicatorsController = IndicatorsController;
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({
        summary: 'List all indicators',
        description: 'Returns a plain array. Used for dropdowns and full-list selects.',
    }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Plain array of indicators' }),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [find_indicators_query_dto_js_1.FindIndicatorsQueryDto]),
    __metadata("design:returntype", void 0)
], IndicatorsController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Get a single indicator by ID' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Indicator UUID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Indicator object' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Indicator not found' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], IndicatorsController.prototype, "findOne", null);
__decorate([
    (0, common_1.Get)(':id/progress'),
    (0, swagger_1.ApiOperation)({
        summary: 'Get progress history for an indicator',
        description: 'Returns progress entries oldest-first.',
    }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Indicator UUID' }),
    (0, swagger_1.ApiQuery)({
        name: 'from',
        required: false,
        description: 'ISO date filter start',
    }),
    (0, swagger_1.ApiQuery)({ name: 'to', required: false, description: 'ISO date filter end' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Array of progress entries (oldest first)',
    }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Query)('from')),
    __param(2, (0, common_1.Query)('to')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", void 0)
], IndicatorsController.prototype, "getProgress", null);
__decorate([
    (0, common_1.Post)(':id/progress'),
    (0, common_1.UseGuards)(jwt_or_api_token_guard_js_1.JwtOrApiTokenGuard),
    (0, roles_decorator_js_1.Roles)(user_role_enum_js_1.UserRole.ADMIN, user_role_enum_js_1.UserRole.ME_STAFF, user_role_enum_js_1.UserRole.PROGRAMME_STAFF, user_role_enum_js_1.UserRole.API_TOKEN),
    (0, swagger_1.ApiOperation)({
        summary: 'Log a progress entry for an indicator',
        description: 'Creates a new progress entry and updates the indicator current_value and status. Accepts a JWT (any of admin / me_staff / programme_staff) or an API token. API tokens may only post against indicators whose data_source_type is non-mappable (external_feed / tracer_study / contractor_report / financial_statement / policy_document) — the path their data legitimately flows through.',
    }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Indicator UUID' }),
    (0, swagger_1.ApiResponse)({
        status: 201,
        description: 'Created progress entry with updated indicator status',
    }),
    (0, swagger_1.ApiResponse)({
        status: 403,
        description: 'API-token actor attempting to write to a form-mappable indicator (API_TOKEN_NOT_PERMITTED_FOR_INDICATOR).',
    }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Indicator not found' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, create_progress_dto_js_1.CreateProgressDto, Object]),
    __metadata("design:returntype", Promise)
], IndicatorsController.prototype, "addProgress", null);
__decorate([
    (0, common_1.Get)(':id/forms'),
    (0, swagger_1.ApiOperation)({
        summary: 'Get forms linked to an indicator',
        description: 'Returns forms where this indicator ID is in the indicator_ids array.',
    }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Indicator UUID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Array of linked forms' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Indicator not found' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], IndicatorsController.prototype, "getLinkedForms", null);
__decorate([
    (0, common_1.Post)(),
    (0, roles_decorator_js_1.Roles)(user_role_enum_js_1.UserRole.ADMIN, user_role_enum_js_1.UserRole.ME_STAFF),
    (0, swagger_1.ApiOperation)({
        summary: 'Create a new indicator',
        description: 'Sets current_value = baseline and computes initial status.',
    }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Created indicator' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_indicator_dto_js_1.CreateIndicatorDto, Object]),
    __metadata("design:returntype", void 0)
], IndicatorsController.prototype, "create", null);
__decorate([
    (0, common_1.Put)(':id'),
    (0, roles_decorator_js_1.Roles)(user_role_enum_js_1.UserRole.ADMIN, user_role_enum_js_1.UserRole.ME_STAFF),
    (0, swagger_1.ApiOperation)({
        summary: 'Update an indicator (partial)',
        description: 'Recomputes status if current_value or target changes.',
    }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Indicator UUID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Updated indicator' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Indicator not found' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_indicator_dto_js_1.UpdateIndicatorDto, Object]),
    __metadata("design:returntype", void 0)
], IndicatorsController.prototype, "update", null);
__decorate([
    (0, common_1.Get)(':id/year-targets'),
    (0, swagger_1.ApiOperation)({
        summary: 'Get the multi-year targets for an indicator',
        description: 'Returns rows sorted by year ascending. Empty array if none defined.',
    }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Indicator UUID' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Array of year-target rows (sorted ascending by year)',
    }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Indicator not found' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], IndicatorsController.prototype, "getYearTargets", null);
__decorate([
    (0, common_1.Put)(':id/year-targets'),
    (0, roles_decorator_js_1.Roles)(user_role_enum_js_1.UserRole.ADMIN, user_role_enum_js_1.UserRole.ME_STAFF),
    (0, swagger_1.ApiOperation)({
        summary: 'Replace the multi-year targets for an indicator',
        description: 'Bulk replace — deletes existing rows and inserts the payload atomically. Recomputes indicator status afterwards.',
    }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Indicator UUID' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Persisted year-target rows (sorted ascending by year)',
    }),
    (0, swagger_1.ApiResponse)({
        status: 400,
        description: 'Duplicate years in payload',
    }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Indicator not found' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, year_target_dto_js_1.SetYearTargetsDto, Object]),
    __metadata("design:returntype", void 0)
], IndicatorsController.prototype, "setYearTargets", null);
__decorate([
    (0, common_1.Get)(':id/disaggregation'),
    (0, swagger_1.ApiOperation)({
        summary: 'Get disaggregation rules for an indicator',
        description: 'Returns one row per axis (sex, age_band, cohort, skill_level, geography, university_origin). Empty array if no rules defined.',
    }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Indicator UUID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Array of disaggregation rules' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Indicator not found' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], IndicatorsController.prototype, "getDisaggregation", null);
__decorate([
    (0, common_1.Put)(':id/disaggregation'),
    (0, roles_decorator_js_1.Roles)(user_role_enum_js_1.UserRole.ADMIN, user_role_enum_js_1.UserRole.ME_STAFF),
    (0, swagger_1.ApiOperation)({
        summary: 'Replace disaggregation rules for an indicator',
        description: 'Bulk replace — deletes existing rules and inserts the payload atomically. Each axis may appear at most once.',
    }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Indicator UUID' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Persisted disaggregation rules (sorted ascending by axis)',
    }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Duplicate axes in payload' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Indicator not found' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, disaggregation_dto_js_1.SetDisaggregationsDto, Object]),
    __metadata("design:returntype", void 0)
], IndicatorsController.prototype, "setDisaggregation", null);
__decorate([
    (0, common_1.Get)(':id/disaggregation/rollup'),
    (0, swagger_1.ApiOperation)({
        summary: 'Aggregate disaggregated progress for an indicator on one axis',
        description: 'Sums value_breakdown JSONB across every progress entry on the given axis. Returns total, per-bucket counts, the matching rule target (if any), and the bucket-keyed gap to target.',
    }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Indicator UUID' }),
    (0, swagger_1.ApiQuery)({
        name: 'axis',
        enum: [
            'sex',
            'age_band',
            'cohort',
            'skill_level',
            'geography',
            'university_origin',
        ],
        description: 'Axis to aggregate over',
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Rollup with total, buckets, target, and gap',
    }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Indicator not found' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, disaggregation_dto_js_1.RollupQueryDto]),
    __metadata("design:returntype", void 0)
], IndicatorsController.prototype, "getDisaggregationRollup", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, roles_decorator_js_1.Roles)(user_role_enum_js_1.UserRole.ADMIN),
    (0, common_1.HttpCode)(common_1.HttpStatus.NO_CONTENT),
    (0, swagger_1.ApiOperation)({ summary: 'Delete an indicator (admin only)' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Indicator UUID' }),
    (0, swagger_1.ApiResponse)({ status: 204, description: 'Deleted' }),
    (0, swagger_1.ApiResponse)({ status: 409, description: 'Indicator has linked submissions' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], IndicatorsController.prototype, "remove", null);
exports.IndicatorsController = IndicatorsController = __decorate([
    (0, swagger_1.ApiTags)('Indicators'),
    (0, swagger_1.ApiBearerAuth)('JWT'),
    (0, common_1.Controller)('indicators'),
    __metadata("design:paramtypes", [indicators_service_js_1.IndicatorsService,
        disaggregation_service_js_1.DisaggregationService])
], IndicatorsController);
//# sourceMappingURL=indicators.controller.js.map