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
exports.ProjectRisksController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const project_risks_service_js_1 = require("./project-risks.service.js");
const upsert_risk_dto_js_1 = require("./dto/upsert-risk.dto.js");
const roles_decorator_js_1 = require("../auth/roles.decorator.js");
const user_role_enum_js_1 = require("../common/enums/user-role.enum.js");
let ProjectRisksController = class ProjectRisksController {
    service;
    constructor(service) {
        this.service = service;
    }
    findAll(include_resolved) {
        return this.service.findAll({
            include_resolved: include_resolved === 'true',
        });
    }
    create(dto, req) {
        return this.service.create(dto, req.user.id, req.user.email);
    }
    update(id, dto, req) {
        return this.service.update(id, dto, req.user.id, req.user.email);
    }
    resolve(id, req) {
        return this.service.resolve(id, req.user.id, req.user.email);
    }
};
exports.ProjectRisksController = ProjectRisksController;
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({
        summary: 'List risks. By default returns active (not resolved); pass include_resolved=true for full history.',
    }),
    (0, swagger_1.ApiQuery)({ name: 'include_resolved', required: false, type: Boolean }),
    __param(0, (0, common_1.Query)('include_resolved')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], ProjectRisksController.prototype, "findAll", null);
__decorate([
    (0, common_1.Post)(),
    (0, roles_decorator_js_1.Roles)(user_role_enum_js_1.UserRole.ADMIN, user_role_enum_js_1.UserRole.ME_STAFF),
    (0, swagger_1.ApiOperation)({ summary: 'Create a risk entry' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [upsert_risk_dto_js_1.UpsertRiskDto, Object]),
    __metadata("design:returntype", void 0)
], ProjectRisksController.prototype, "create", null);
__decorate([
    (0, common_1.Put)(':id'),
    (0, roles_decorator_js_1.Roles)(user_role_enum_js_1.UserRole.ADMIN, user_role_enum_js_1.UserRole.ME_STAFF),
    (0, swagger_1.ApiOperation)({ summary: 'Update a risk entry' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, upsert_risk_dto_js_1.UpsertRiskDto, Object]),
    __metadata("design:returntype", void 0)
], ProjectRisksController.prototype, "update", null);
__decorate([
    (0, common_1.Patch)(':id/resolve'),
    (0, roles_decorator_js_1.Roles)(user_role_enum_js_1.UserRole.ADMIN, user_role_enum_js_1.UserRole.ME_STAFF),
    (0, swagger_1.ApiOperation)({
        summary: 'Mark a risk as resolved (soft delete — preserves the row for audit).',
    }),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], ProjectRisksController.prototype, "resolve", null);
exports.ProjectRisksController = ProjectRisksController = __decorate([
    (0, swagger_1.ApiTags)('Project Risks'),
    (0, swagger_1.ApiBearerAuth)('JWT'),
    (0, common_1.Controller)('project-risks'),
    __metadata("design:paramtypes", [project_risks_service_js_1.ProjectRisksService])
], ProjectRisksController);
//# sourceMappingURL=project-risks.controller.js.map