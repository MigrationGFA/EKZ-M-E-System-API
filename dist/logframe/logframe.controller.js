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
exports.LogframeController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const logframe_service_js_1 = require("./logframe.service.js");
const create_node_dto_js_1 = require("./dto/create-node.dto.js");
const update_node_dto_js_1 = require("./dto/update-node.dto.js");
const link_indicator_dto_js_1 = require("./dto/link-indicator.dto.js");
const roles_decorator_js_1 = require("../auth/roles.decorator.js");
const user_role_enum_js_1 = require("../common/enums/user-role.enum.js");
let LogframeController = class LogframeController {
    logframeService;
    constructor(logframeService) {
        this.logframeService = logframeService;
    }
    getTree() {
        return this.logframeService.getTree();
    }
    createNode(dto, req) {
        return this.logframeService.createNode(dto, req.user.id, req.user.email);
    }
    updateNode(id, dto, req) {
        return this.logframeService.updateNode(id, dto, req.user.id, req.user.email);
    }
    deleteNode(id, req) {
        return this.logframeService.deleteNode(id, req.user.id, req.user.email);
    }
    linkIndicator(id, dto, req) {
        return this.logframeService.linkIndicator(id, dto.indicator_id, req.user.id, req.user.email);
    }
    unlinkIndicator(nodeId, indicatorId, req) {
        return this.logframeService.unlinkIndicator(nodeId, indicatorId, req.user.id, req.user.email);
    }
};
exports.LogframeController = LogframeController;
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({
        summary: 'Get full logframe tree',
        description: 'Returns all logframe nodes as a nested tree (Goal → Outcome → Output → Activity), each with linked indicators.',
    }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Nested array of root goal nodes' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], LogframeController.prototype, "getTree", null);
__decorate([
    (0, common_1.Post)('nodes'),
    (0, roles_decorator_js_1.Roles)(user_role_enum_js_1.UserRole.ADMIN, user_role_enum_js_1.UserRole.ME_STAFF),
    (0, swagger_1.ApiOperation)({ summary: 'Create a new logframe node' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Node created successfully' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Parent type constraint violation' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_node_dto_js_1.CreateNodeDto, Object]),
    __metadata("design:returntype", void 0)
], LogframeController.prototype, "createNode", null);
__decorate([
    (0, common_1.Put)('nodes/:id'),
    (0, roles_decorator_js_1.Roles)(user_role_enum_js_1.UserRole.ADMIN, user_role_enum_js_1.UserRole.ME_STAFF),
    (0, swagger_1.ApiOperation)({ summary: 'Update a logframe node (partial)' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Node UUID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Updated node' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Node not found' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_node_dto_js_1.UpdateNodeDto, Object]),
    __metadata("design:returntype", void 0)
], LogframeController.prototype, "updateNode", null);
__decorate([
    (0, common_1.Delete)('nodes/:id'),
    (0, roles_decorator_js_1.Roles)(user_role_enum_js_1.UserRole.ADMIN, user_role_enum_js_1.UserRole.ME_STAFF),
    (0, common_1.HttpCode)(common_1.HttpStatus.NO_CONTENT),
    (0, swagger_1.ApiOperation)({ summary: 'Delete a logframe node' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Node UUID' }),
    (0, swagger_1.ApiResponse)({ status: 204, description: 'Node deleted' }),
    (0, swagger_1.ApiResponse)({
        status: 400,
        description: 'Node has children — remove them first',
    }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], LogframeController.prototype, "deleteNode", null);
__decorate([
    (0, common_1.Post)('nodes/:id/indicators'),
    (0, roles_decorator_js_1.Roles)(user_role_enum_js_1.UserRole.ADMIN, user_role_enum_js_1.UserRole.ME_STAFF),
    (0, swagger_1.ApiOperation)({ summary: 'Link an indicator to a logframe node' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Node UUID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: '{ success: true }' }),
    (0, swagger_1.ApiResponse)({
        status: 409,
        description: 'Indicator already linked to this node',
    }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, link_indicator_dto_js_1.LinkIndicatorDto, Object]),
    __metadata("design:returntype", void 0)
], LogframeController.prototype, "linkIndicator", null);
__decorate([
    (0, common_1.Delete)('nodes/:nodeId/indicators/:indicatorId'),
    (0, roles_decorator_js_1.Roles)(user_role_enum_js_1.UserRole.ADMIN, user_role_enum_js_1.UserRole.ME_STAFF),
    (0, common_1.HttpCode)(common_1.HttpStatus.NO_CONTENT),
    (0, swagger_1.ApiOperation)({ summary: 'Unlink an indicator from a logframe node' }),
    (0, swagger_1.ApiParam)({ name: 'nodeId', description: 'Node UUID' }),
    (0, swagger_1.ApiParam)({ name: 'indicatorId', description: 'Indicator UUID' }),
    (0, swagger_1.ApiResponse)({ status: 204, description: 'Unlinked' }),
    __param(0, (0, common_1.Param)('nodeId')),
    __param(1, (0, common_1.Param)('indicatorId')),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", void 0)
], LogframeController.prototype, "unlinkIndicator", null);
exports.LogframeController = LogframeController = __decorate([
    (0, swagger_1.ApiTags)('Logframe'),
    (0, swagger_1.ApiBearerAuth)('JWT'),
    (0, common_1.Controller)('logframe'),
    __metadata("design:paramtypes", [logframe_service_js_1.LogframeService])
], LogframeController);
//# sourceMappingURL=logframe.controller.js.map