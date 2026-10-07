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
exports.FormsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const forms_service_js_1 = require("./forms.service.js");
const create_form_dto_js_1 = require("./dto/create-form.dto.js");
const update_form_dto_js_1 = require("./dto/update-form.dto.js");
const roles_decorator_js_1 = require("../auth/roles.decorator.js");
const user_role_enum_js_1 = require("../common/enums/user-role.enum.js");
let FormsController = class FormsController {
    formsService;
    constructor(formsService) {
        this.formsService = formsService;
    }
    findAll(status, assigned_to) {
        return this.formsService.findAll({ status, assigned_to });
    }
    findOne(id) {
        return this.formsService.findOne(id);
    }
    create(dto, req) {
        return this.formsService.create({
            ...dto,
            created_by: req.user.id,
        }, req.user.id, req.user.email);
    }
    update(id, dto, req) {
        return this.formsService.update(id, dto, req.user.id, req.user.email);
    }
    remove(id, req) {
        return this.formsService.remove(id, req.user.id, req.user.email);
    }
};
exports.FormsController = FormsController;
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'List all forms' }),
    (0, swagger_1.ApiQuery)({ name: 'status', required: false, enum: ['draft', 'published'] }),
    (0, swagger_1.ApiQuery)({
        name: 'assigned_to',
        required: false,
        description: 'Filter by assigned user UUID',
    }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Plain array of form objects' }),
    __param(0, (0, common_1.Query)('status')),
    __param(1, (0, common_1.Query)('assigned_to')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], FormsController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Get a single form by ID' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Form UUID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Form object' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Form not found' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], FormsController.prototype, "findOne", null);
__decorate([
    (0, common_1.Post)(),
    (0, roles_decorator_js_1.Roles)(user_role_enum_js_1.UserRole.ADMIN, user_role_enum_js_1.UserRole.ME_STAFF),
    (0, swagger_1.ApiOperation)({ summary: 'Create a new form' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Created form' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_form_dto_js_1.CreateFormDto, Object]),
    __metadata("design:returntype", void 0)
], FormsController.prototype, "create", null);
__decorate([
    (0, common_1.Put)(':id'),
    (0, roles_decorator_js_1.Roles)(user_role_enum_js_1.UserRole.ADMIN, user_role_enum_js_1.UserRole.ME_STAFF),
    (0, swagger_1.ApiOperation)({ summary: 'Update a form (partial)' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Form UUID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Updated form' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Form not found' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_form_dto_js_1.UpdateFormDto, Object]),
    __metadata("design:returntype", void 0)
], FormsController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, roles_decorator_js_1.Roles)(user_role_enum_js_1.UserRole.ADMIN, user_role_enum_js_1.UserRole.ME_STAFF),
    (0, common_1.HttpCode)(common_1.HttpStatus.NO_CONTENT),
    (0, swagger_1.ApiOperation)({ summary: 'Delete a form' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Form UUID' }),
    (0, swagger_1.ApiResponse)({ status: 204, description: 'Deleted' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], FormsController.prototype, "remove", null);
exports.FormsController = FormsController = __decorate([
    (0, swagger_1.ApiTags)('Forms'),
    (0, swagger_1.ApiBearerAuth)('JWT'),
    (0, common_1.Controller)('forms'),
    __metadata("design:paramtypes", [forms_service_js_1.FormsService])
], FormsController);
//# sourceMappingURL=forms.controller.js.map