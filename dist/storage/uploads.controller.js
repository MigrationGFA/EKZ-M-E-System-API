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
exports.UploadsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const throttler_1 = require("@nestjs/throttler");
const roles_decorator_js_1 = require("../auth/roles.decorator.js");
const user_role_enum_js_1 = require("../common/enums/user-role.enum.js");
const azure_storage_service_js_1 = require("./azure-storage.service.js");
const upload_image_dto_js_1 = require("./dto/upload-image.dto.js");
let UploadsController = class UploadsController {
    azureStorage;
    constructor(azureStorage) {
        this.azureStorage = azureStorage;
    }
    async uploadImage(dto, _req) {
        const containerName = process.env.AZURE_CONTAINER_IMAGES ?? 'wiftimages';
        const url = await this.azureStorage.uploadBase64Image(containerName, dto.submissionId, dto.fieldId, dto.base64);
        return { url };
    }
};
exports.UploadsController = UploadsController;
__decorate([
    (0, common_1.Post)('image'),
    (0, roles_decorator_js_1.Roles)(user_role_enum_js_1.UserRole.ADMIN, user_role_enum_js_1.UserRole.ME_STAFF, user_role_enum_js_1.UserRole.PROGRAMME_STAFF),
    (0, throttler_1.Throttle)({ default: { ttl: 60000, limit: 30 } }),
    (0, swagger_1.ApiOperation)({
        summary: 'Upload a photo field to Azure Blob Storage',
        description: 'Accepts a base64 image data URL, uploads it to the images container, ' +
            'and returns the public blob URL. Blob path is deterministic ' +
            '(submissions/{submissionId}/{fieldId}.jpg) so retries are idempotent.',
    }),
    (0, swagger_1.ApiResponse)({
        status: 201,
        description: '{ url: string } — public Azure blob URL',
    }),
    (0, swagger_1.ApiResponse)({
        status: 400,
        description: 'Invalid data URL or payload too large',
    }),
    (0, swagger_1.ApiResponse)({ status: 500, description: 'Azure upload failed' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [upload_image_dto_js_1.UploadImageDto, Object]),
    __metadata("design:returntype", Promise)
], UploadsController.prototype, "uploadImage", null);
exports.UploadsController = UploadsController = __decorate([
    (0, swagger_1.ApiTags)('Uploads'),
    (0, swagger_1.ApiBearerAuth)('JWT'),
    (0, common_1.Controller)('uploads'),
    __metadata("design:paramtypes", [azure_storage_service_js_1.AzureStorageService])
], UploadsController);
//# sourceMappingURL=uploads.controller.js.map