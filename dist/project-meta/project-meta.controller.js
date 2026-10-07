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
exports.ProjectMetaController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const project_meta_service_js_1 = require("./project-meta.service.js");
const upsert_project_meta_dto_js_1 = require("./dto/upsert-project-meta.dto.js");
const roles_decorator_js_1 = require("../auth/roles.decorator.js");
const user_role_enum_js_1 = require("../common/enums/user-role.enum.js");
let ProjectMetaController = class ProjectMetaController {
    metaService;
    constructor(metaService) {
        this.metaService = metaService;
    }
    get() {
        return this.metaService.get();
    }
    upsert(dto, req) {
        return this.metaService.upsert(dto, req.user.id, req.user.email);
    }
};
exports.ProjectMetaController = ProjectMetaController;
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({
        summary: 'Get project metadata (singleton)',
        description: 'Returns the single project_meta row. Any authenticated user may read.',
    }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Project metadata object' }),
    (0, swagger_1.ApiResponse)({
        status: 404,
        description: 'Project metadata has not been initialised yet',
    }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], ProjectMetaController.prototype, "get", null);
__decorate([
    (0, common_1.Put)(),
    (0, roles_decorator_js_1.Roles)(user_role_enum_js_1.UserRole.ADMIN),
    (0, swagger_1.ApiOperation)({
        summary: 'Upsert project metadata (admin only)',
        description: 'Creates the row on first call; updates it on subsequent calls. ' +
            'Validates completion_year > baseline_year and that pdo_node_id ' +
            '(if provided) references a logframe node of type "pdo".',
    }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Saved project metadata object' }),
    (0, swagger_1.ApiResponse)({
        status: 400,
        description: 'completion_year must be greater than baseline_year',
    }),
    (0, swagger_1.ApiResponse)({
        status: 422,
        description: 'pdo_node_id does not exist or is not type "pdo"',
    }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [upsert_project_meta_dto_js_1.UpsertProjectMetaDto, Object]),
    __metadata("design:returntype", void 0)
], ProjectMetaController.prototype, "upsert", null);
exports.ProjectMetaController = ProjectMetaController = __decorate([
    (0, swagger_1.ApiTags)('Project Meta'),
    (0, swagger_1.ApiBearerAuth)('JWT'),
    (0, common_1.Controller)('project-meta'),
    __metadata("design:paramtypes", [project_meta_service_js_1.ProjectMetaService])
], ProjectMetaController);
//# sourceMappingURL=project-meta.controller.js.map