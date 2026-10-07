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
exports.LocationsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const locations_service_js_1 = require("./locations.service.js");
const create_location_dto_js_1 = require("./dto/create-location.dto.js");
const update_location_dto_js_1 = require("./dto/update-location.dto.js");
const roles_decorator_js_1 = require("../auth/roles.decorator.js");
const user_role_enum_js_1 = require("../common/enums/user-role.enum.js");
let LocationsController = class LocationsController {
    locationsService;
    constructor(locationsService) {
        this.locationsService = locationsService;
    }
    findAll(sector, status) {
        return this.locationsService.findAll({ sector, status });
    }
    findOne(id) {
        return this.locationsService.findOne(id);
    }
    create(dto, req) {
        return this.locationsService.create({ ...dto, created_by: req.user.id }, req.user.id, req.user.email);
    }
    update(id, dto, req) {
        return this.locationsService.update(id, dto, req.user.id, req.user.email);
    }
    remove(id, req) {
        return this.locationsService.remove(id, req.user.id, req.user.email);
    }
    getIndicatorLocations(indicatorId) {
        return this.locationsService.getIndicatorLocations(indicatorId);
    }
};
exports.LocationsController = LocationsController;
__decorate([
    (0, common_1.Get)('projects'),
    (0, swagger_1.ApiOperation)({
        summary: 'Get all project locations as GeoJSON FeatureCollection',
        description: 'status and completion are computed live from linked indicators — never stored. GeoJSON coordinates are [lng, lat].',
    }),
    (0, swagger_1.ApiQuery)({ name: 'sector', required: false }),
    (0, swagger_1.ApiQuery)({
        name: 'status',
        required: false,
        enum: ['on_track', 'at_risk', 'off_track', 'no_data'],
    }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'GeoJSON FeatureCollection' }),
    __param(0, (0, common_1.Query)('sector')),
    __param(1, (0, common_1.Query)('status')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], LocationsController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('projects/:id'),
    (0, swagger_1.ApiOperation)({
        summary: 'Get a single project location (properties object, not GeoJSON wrapper)',
    }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Location UUID' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Location properties with computed status and completion',
    }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Location not found' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], LocationsController.prototype, "findOne", null);
__decorate([
    (0, common_1.Post)('projects'),
    (0, roles_decorator_js_1.Roles)(user_role_enum_js_1.UserRole.ADMIN, user_role_enum_js_1.UserRole.ME_STAFF),
    (0, swagger_1.ApiOperation)({ summary: 'Create a new project location' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Created location properties' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_location_dto_js_1.CreateLocationDto, Object]),
    __metadata("design:returntype", void 0)
], LocationsController.prototype, "create", null);
__decorate([
    (0, common_1.Put)('projects/:id'),
    (0, roles_decorator_js_1.Roles)(user_role_enum_js_1.UserRole.ADMIN, user_role_enum_js_1.UserRole.ME_STAFF),
    (0, swagger_1.ApiOperation)({ summary: 'Update a project location (partial)' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Location UUID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Updated location properties' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Location not found' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_location_dto_js_1.UpdateLocationDto, Object]),
    __metadata("design:returntype", void 0)
], LocationsController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)('projects/:id'),
    (0, roles_decorator_js_1.Roles)(user_role_enum_js_1.UserRole.ADMIN),
    (0, common_1.HttpCode)(common_1.HttpStatus.NO_CONTENT),
    (0, swagger_1.ApiOperation)({ summary: 'Delete a project location (admin only)' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Location UUID' }),
    (0, swagger_1.ApiResponse)({ status: 204, description: 'Deleted' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], LocationsController.prototype, "remove", null);
__decorate([
    (0, common_1.Get)('indicators/:indicatorId'),
    (0, swagger_1.ApiOperation)({
        summary: 'Get GeoJSON FeatureCollection of submission locations for an indicator',
    }),
    (0, swagger_1.ApiParam)({ name: 'indicatorId', description: 'Indicator UUID' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'GeoJSON FeatureCollection of data collection points',
    }),
    __param(0, (0, common_1.Param)('indicatorId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], LocationsController.prototype, "getIndicatorLocations", null);
exports.LocationsController = LocationsController = __decorate([
    (0, swagger_1.ApiTags)('Locations'),
    (0, swagger_1.ApiBearerAuth)('JWT'),
    (0, common_1.Controller)('locations'),
    __metadata("design:paramtypes", [locations_service_js_1.LocationsService])
], LocationsController);
//# sourceMappingURL=locations.controller.js.map