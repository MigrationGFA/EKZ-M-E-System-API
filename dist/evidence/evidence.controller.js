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
exports.EvidenceController = void 0;
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const swagger_1 = require("@nestjs/swagger");
const throttler_1 = require("@nestjs/throttler");
const multer_1 = require("multer");
const roles_decorator_js_1 = require("../auth/roles.decorator.js");
const user_role_enum_js_1 = require("../common/enums/user-role.enum.js");
const azure_storage_service_js_1 = require("../storage/azure-storage.service.js");
const evidence_service_js_1 = require("./evidence.service.js");
const create_evidence_dto_js_1 = require("./dto/create-evidence.dto.js");
const update_evidence_dto_js_1 = require("./dto/update-evidence.dto.js");
const query_evidence_dto_js_1 = require("./dto/query-evidence.dto.js");
const sha256_js_1 = require("./helpers/sha256.js");
const node_crypto_1 = require("node:crypto");
const FIFTY_MB = 50 * 1024 * 1024;
let EvidenceController = class EvidenceController {
    service;
    azureStorage;
    constructor(service, azureStorage) {
        this.service = service;
        this.azureStorage = azureStorage;
    }
    async uploadDocument(file) {
        if (!file) {
            throw new common_1.BadRequestException('No file uploaded under field "file"');
        }
        if (!file.buffer || file.buffer.length === 0) {
            throw new common_1.BadRequestException('Uploaded file is empty');
        }
        const containerName = process.env.AZURE_CONTAINER_DOCUMENTS ?? 'wiftdocuments';
        const blobId = (0, node_crypto_1.randomUUID)();
        const safeName = sanitiseFilename(file.originalname);
        const key = `documents/${blobId}/${safeName}`;
        const url = await this.azureStorage.uploadDocument(containerName, key, file.buffer, file.mimetype);
        return {
            file_url: url,
            file_size_bytes: file.buffer.length,
            mime_type: file.mimetype,
            sha256: (0, sha256_js_1.sha256Hex)(file.buffer),
        };
    }
    create(dto, req) {
        return this.service.create(dto, req.user, req.user.email);
    }
    findAll(query, req) {
        return this.service.findAll(query, req.user);
    }
    findOne(id, req) {
        return this.service.findOne(id, req.user);
    }
    update(id, dto, req) {
        return this.service.update(id, dto, req.user, req.user.email);
    }
    async replace(id, file, body, req) {
        if (!file) {
            throw new common_1.BadRequestException('No file uploaded under field "file"');
        }
        if (!file.buffer || file.buffer.length === 0) {
            throw new common_1.BadRequestException('Uploaded file is empty');
        }
        const containerName = process.env.AZURE_CONTAINER_DOCUMENTS ?? 'wiftdocuments';
        const blobId = (0, node_crypto_1.randomUUID)();
        const safeName = sanitiseFilename(file.originalname);
        const key = `documents/${blobId}/${safeName}`;
        const url = await this.azureStorage.uploadDocument(containerName, key, file.buffer, file.mimetype);
        let parsedMetadata;
        if (body.type_metadata) {
            try {
                parsedMetadata = JSON.parse(body.type_metadata);
            }
            catch {
                throw new common_1.BadRequestException('type_metadata must be valid JSON');
            }
        }
        return this.service.replace(id, {
            file_url: url,
            file_size_bytes: file.buffer.length,
            mime_type: file.mimetype,
            sha256: (0, sha256_js_1.sha256Hex)(file.buffer),
        }, req.user, req.user.email, {
            force: body.force === 'true',
            title: body.title,
            description: body.description,
            type_metadata: parsedMetadata,
        });
    }
    remove(id, req) {
        return this.service.softDelete(id, req.user, req.user.email);
    }
};
exports.EvidenceController = EvidenceController;
__decorate([
    (0, common_1.Post)('uploads/document'),
    (0, roles_decorator_js_1.Roles)(user_role_enum_js_1.UserRole.ADMIN, user_role_enum_js_1.UserRole.ME_STAFF, user_role_enum_js_1.UserRole.PROGRAMME_STAFF),
    (0, throttler_1.Throttle)({ default: { ttl: 60000, limit: 20 } }),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('file', {
        storage: (0, multer_1.memoryStorage)(),
        limits: { fileSize: FIFTY_MB },
    })),
    (0, swagger_1.ApiOperation)({
        summary: 'Upload a document blob (multipart). Returns the blob descriptor.',
        description: 'Streams the file to Azure container `wiftdocuments` (or local disk fallback). ' +
            'Returns the public URL plus SHA-256, size, and detected MIME — pass these ' +
            'fields to POST /api/evidence to persist the metadata row.',
    }),
    (0, swagger_1.ApiConsumes)('multipart/form-data'),
    (0, swagger_1.ApiBody)({
        schema: {
            type: 'object',
            properties: { file: { type: 'string', format: 'binary' } },
        },
    }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Upload descriptor' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Missing or oversized file' }),
    __param(0, (0, common_1.UploadedFile)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], EvidenceController.prototype, "uploadDocument", null);
__decorate([
    (0, common_1.Post)('evidence'),
    (0, roles_decorator_js_1.Roles)(user_role_enum_js_1.UserRole.ADMIN, user_role_enum_js_1.UserRole.ME_STAFF, user_role_enum_js_1.UserRole.PROGRAMME_STAFF),
    (0, swagger_1.ApiOperation)({ summary: 'Persist evidence metadata for an uploaded blob' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Created' }),
    (0, swagger_1.ApiResponse)({ status: 422, description: 'Missing required metadata field' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_evidence_dto_js_1.CreateEvidenceDto, Object]),
    __metadata("design:returntype", void 0)
], EvidenceController.prototype, "create", null);
__decorate([
    (0, common_1.Get)('evidence'),
    (0, roles_decorator_js_1.Roles)(user_role_enum_js_1.UserRole.ADMIN, user_role_enum_js_1.UserRole.ME_STAFF, user_role_enum_js_1.UserRole.PROGRAMME_STAFF, user_role_enum_js_1.UserRole.VIEWER),
    (0, swagger_1.ApiOperation)({
        summary: 'List evidence documents',
        description: 'Per-type read RBAC narrows results: viewers see only external_data_extract, ' +
            'programme staff see their own photo_evidence + policy_document + mou. ' +
            'admin / me_staff see all.',
    }),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [query_evidence_dto_js_1.QueryEvidenceDto, Object]),
    __metadata("design:returntype", void 0)
], EvidenceController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('evidence/:id'),
    (0, roles_decorator_js_1.Roles)(user_role_enum_js_1.UserRole.ADMIN, user_role_enum_js_1.UserRole.ME_STAFF, user_role_enum_js_1.UserRole.PROGRAMME_STAFF, user_role_enum_js_1.UserRole.VIEWER),
    __param(0, (0, common_1.Param)('id', new common_1.ParseUUIDPipe())),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], EvidenceController.prototype, "findOne", null);
__decorate([
    (0, common_1.Patch)('evidence/:id'),
    (0, roles_decorator_js_1.Roles)(user_role_enum_js_1.UserRole.ADMIN, user_role_enum_js_1.UserRole.ME_STAFF, user_role_enum_js_1.UserRole.PROGRAMME_STAFF),
    (0, swagger_1.ApiOperation)({ summary: 'Update evidence metadata (file unchanged)' }),
    __param(0, (0, common_1.Param)('id', new common_1.ParseUUIDPipe())),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_evidence_dto_js_1.UpdateEvidenceDto, Object]),
    __metadata("design:returntype", void 0)
], EvidenceController.prototype, "update", null);
__decorate([
    (0, common_1.Patch)('evidence/:id/replace'),
    (0, roles_decorator_js_1.Roles)(user_role_enum_js_1.UserRole.ADMIN, user_role_enum_js_1.UserRole.ME_STAFF, user_role_enum_js_1.UserRole.PROGRAMME_STAFF),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('file', {
        storage: (0, multer_1.memoryStorage)(),
        limits: { fileSize: FIFTY_MB },
    })),
    (0, swagger_1.ApiOperation)({
        summary: 'Replace the file blob; supersedes the previous row',
        description: 'Returns 409 with both SHAs unless `force=true` is sent as a form field. ' +
            'On force, a new row is inserted with `supersedes_id` set to this one, and ' +
            'this row is soft-deleted. Bytes identical to the existing blob are a no-op.',
    }),
    (0, swagger_1.ApiConsumes)('multipart/form-data'),
    (0, swagger_1.ApiBody)({
        schema: {
            type: 'object',
            properties: {
                file: { type: 'string', format: 'binary' },
                force: { type: 'string', description: 'set to "true" to confirm' },
                title: { type: 'string' },
                description: { type: 'string' },
                type_metadata: {
                    type: 'string',
                    description: 'JSON-encoded metadata blob',
                },
            },
        },
    }),
    __param(0, (0, common_1.Param)('id', new common_1.ParseUUIDPipe())),
    __param(1, (0, common_1.UploadedFile)()),
    __param(2, (0, common_1.Body)()),
    __param(3, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object, Object]),
    __metadata("design:returntype", Promise)
], EvidenceController.prototype, "replace", null);
__decorate([
    (0, common_1.Delete)('evidence/:id'),
    (0, roles_decorator_js_1.Roles)(user_role_enum_js_1.UserRole.ADMIN, user_role_enum_js_1.UserRole.ME_STAFF),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Soft-delete an evidence document' }),
    __param(0, (0, common_1.Param)('id', new common_1.ParseUUIDPipe())),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], EvidenceController.prototype, "remove", null);
exports.EvidenceController = EvidenceController = __decorate([
    (0, swagger_1.ApiTags)('Evidence'),
    (0, swagger_1.ApiBearerAuth)('JWT'),
    (0, common_1.Controller)(),
    __metadata("design:paramtypes", [evidence_service_js_1.EvidenceService,
        azure_storage_service_js_1.AzureStorageService])
], EvidenceController);
function sanitiseFilename(name) {
    const safe = (name ?? 'document').replace(/[^a-zA-Z0-9._-]+/g, '_');
    return safe.slice(0, 120) || 'document';
}
//# sourceMappingURL=evidence.controller.js.map