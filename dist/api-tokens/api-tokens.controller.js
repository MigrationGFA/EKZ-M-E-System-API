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
exports.ApiTokensController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const api_tokens_service_js_1 = require("./api-tokens.service.js");
const create_token_dto_js_1 = require("./dto/create-token.dto.js");
const roles_decorator_js_1 = require("../auth/roles.decorator.js");
const user_role_enum_js_1 = require("../common/enums/user-role.enum.js");
let ApiTokensController = class ApiTokensController {
    apiTokensService;
    constructor(apiTokensService) {
        this.apiTokensService = apiTokensService;
    }
    findAll() {
        return this.apiTokensService.findAll();
    }
    create(dto, req) {
        return this.apiTokensService.create(dto.name, req.user.id, req.user.email);
    }
    remove(id, req) {
        return this.apiTokensService.remove(id, req.user.id, req.user.email);
    }
};
exports.ApiTokensController = ApiTokensController;
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({
        summary: 'List all API tokens (masked)',
        description: 'Never returns token_hash or rawToken. Only tokenPart (partial token for display).',
    }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Array of masked token objects' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], ApiTokensController.prototype, "findAll", null);
__decorate([
    (0, common_1.Post)(),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    (0, swagger_1.ApiOperation)({
        summary: 'Create a new API token',
        description: 'Generates a random token (ekz_LIVE_ + 32 hex chars). Stores the bcrypt hash. The rawToken is returned ONLY in this response — it cannot be retrieved again.',
    }),
    (0, swagger_1.ApiResponse)({
        status: 201,
        description: 'Token object including rawToken (one-time only)',
    }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_token_dto_js_1.CreateTokenDto, Object]),
    __metadata("design:returntype", void 0)
], ApiTokensController.prototype, "create", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Delete (revoke) an API token' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Token UUID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: '{ success: true }' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Token not found' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], ApiTokensController.prototype, "remove", null);
exports.ApiTokensController = ApiTokensController = __decorate([
    (0, swagger_1.ApiTags)('API Tokens'),
    (0, swagger_1.ApiBearerAuth)('JWT'),
    (0, common_1.Controller)('api-tokens'),
    (0, roles_decorator_js_1.Roles)(user_role_enum_js_1.UserRole.ADMIN),
    __metadata("design:paramtypes", [api_tokens_service_js_1.ApiTokensService])
], ApiTokensController);
//# sourceMappingURL=api-tokens.controller.js.map