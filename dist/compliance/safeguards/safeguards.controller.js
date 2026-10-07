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
exports.SafeguardsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const safeguards_service_js_1 = require("./safeguards.service.js");
const upsert_safeguard_dto_js_1 = require("./dto/upsert-safeguard.dto.js");
const roles_decorator_js_1 = require("../../auth/roles.decorator.js");
const user_role_enum_js_1 = require("../../common/enums/user-role.enum.js");
let SafeguardsController = class SafeguardsController {
    service;
    constructor(service) {
        this.service = service;
    }
    findAll() {
        return this.service.findAll();
    }
    create(dto, req) {
        return this.service.create(dto, req.user.id, req.user.email);
    }
    update(id, dto, req) {
        return this.service.update(id, dto, req.user.id, req.user.email);
    }
    remove(id, req) {
        return this.service.remove(id, req.user.id, req.user.email);
    }
};
exports.SafeguardsController = SafeguardsController;
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'List safeguard measures (QPR section C.1.2)' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], SafeguardsController.prototype, "findAll", null);
__decorate([
    (0, common_1.Post)(),
    (0, roles_decorator_js_1.Roles)(user_role_enum_js_1.UserRole.ADMIN, user_role_enum_js_1.UserRole.ME_STAFF),
    (0, swagger_1.ApiOperation)({ summary: 'Create a safeguard measure group' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [upsert_safeguard_dto_js_1.UpsertSafeguardDto, Object]),
    __metadata("design:returntype", void 0)
], SafeguardsController.prototype, "create", null);
__decorate([
    (0, common_1.Put)(':id'),
    (0, roles_decorator_js_1.Roles)(user_role_enum_js_1.UserRole.ADMIN, user_role_enum_js_1.UserRole.ME_STAFF),
    (0, swagger_1.ApiOperation)({ summary: 'Update a safeguard measure group' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, upsert_safeguard_dto_js_1.UpsertSafeguardDto, Object]),
    __metadata("design:returntype", void 0)
], SafeguardsController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, roles_decorator_js_1.Roles)(user_role_enum_js_1.UserRole.ADMIN, user_role_enum_js_1.UserRole.ME_STAFF),
    (0, common_1.HttpCode)(common_1.HttpStatus.NO_CONTENT),
    (0, swagger_1.ApiOperation)({ summary: 'Delete a safeguard measure group' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], SafeguardsController.prototype, "remove", null);
exports.SafeguardsController = SafeguardsController = __decorate([
    (0, swagger_1.ApiTags)('Compliance'),
    (0, swagger_1.ApiBearerAuth)('JWT'),
    (0, common_1.Controller)('compliance/safeguards'),
    __metadata("design:paramtypes", [safeguards_service_js_1.SafeguardsService])
], SafeguardsController);
//# sourceMappingURL=safeguards.controller.js.map