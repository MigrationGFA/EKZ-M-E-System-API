"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var AzureStorageService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AzureStorageService = void 0;
const node_fs_1 = require("node:fs");
const path = __importStar(require("node:path"));
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const storage_blob_1 = require("@azure/storage-blob");
let AzureStorageService = AzureStorageService_1 = class AzureStorageService {
    config;
    logger = new common_1.Logger(AzureStorageService_1.name);
    blobServiceClient;
    constructor(config) {
        this.config = config;
        const connectionString = this.config.get('AZURE_STORAGE_CONNECTION_STRING');
        if (connectionString) {
            this.blobServiceClient =
                storage_blob_1.BlobServiceClient.fromConnectionString(connectionString);
        }
        else {
            this.logger.warn('AZURE_STORAGE_CONNECTION_STRING is not set — uploads will be saved to local disk');
            this.blobServiceClient = null;
        }
    }
    async uploadBase64Image(containerName, submissionId, fieldId, dataUrl) {
        const { contentType, buffer } = this.decodeDataUrl(dataUrl);
        const extension = this.extensionFromMime(contentType);
        if (!this.blobServiceClient) {
            return this.saveLocally(submissionId, fieldId, extension, buffer);
        }
        const blobName = `submissions/${submissionId}/${fieldId}${extension}`;
        const containerClient = this.getContainerClient(containerName);
        try {
            await containerClient.createIfNotExists({ access: 'blob' });
            const blockBlobClient = containerClient.getBlockBlobClient(blobName);
            await blockBlobClient.uploadData(buffer, {
                blobHTTPHeaders: { blobContentType: contentType },
            });
            this.logger.log(`Uploaded blob: ${blobName} (${buffer.length} bytes)`);
            return blockBlobClient.url;
        }
        catch (err) {
            this.logger.error(`Azure upload failed — container: ${containerName}, blob: ${blobName}`, err instanceof Error ? err.stack : String(err));
            throw new common_1.InternalServerErrorException('Image upload to storage failed');
        }
    }
    async uploadDocument(containerName, key, buffer, contentType) {
        if (!this.blobServiceClient) {
            return this.saveDocumentLocally(key, buffer);
        }
        const containerClient = this.getContainerClient(containerName);
        try {
            await containerClient.createIfNotExists({ access: 'blob' });
            const blockBlobClient = containerClient.getBlockBlobClient(key);
            await blockBlobClient.uploadData(buffer, {
                blobHTTPHeaders: { blobContentType: contentType },
            });
            this.logger.log(`Uploaded document: ${key} (${buffer.length} bytes)`);
            return blockBlobClient.url;
        }
        catch (err) {
            this.logger.error(`Azure document upload failed — container: ${containerName}, key: ${key}`, err instanceof Error ? err.stack : String(err));
            throw new common_1.InternalServerErrorException('Document upload to storage failed');
        }
    }
    async saveDocumentLocally(key, buffer) {
        const dir = path.resolve(process.cwd(), 'uploads', path.dirname(key));
        await node_fs_1.promises.mkdir(dir, { recursive: true });
        const fullPath = path.join(process.cwd(), 'uploads', key);
        await node_fs_1.promises.writeFile(fullPath, buffer);
        const base = process.env.APP_URL ?? `http://localhost:${process.env.PORT ?? 3000}`;
        this.logger.warn(`Azure not configured — saved locally: uploads/${key}`);
        return `${base}/uploads/${key}`;
    }
    async saveLocally(submissionId, fieldId, extension, buffer) {
        const dir = path.resolve(process.cwd(), 'uploads', 'submissions', submissionId);
        await node_fs_1.promises.mkdir(dir, { recursive: true });
        const filename = `${fieldId}${extension}`;
        await node_fs_1.promises.writeFile(path.join(dir, filename), buffer);
        const base = process.env.APP_URL ?? `http://localhost:${process.env.PORT ?? 3000}`;
        this.logger.warn(`Azure not configured — saved locally: uploads/submissions/${submissionId}/${filename}`);
        return `${base}/uploads/submissions/${submissionId}/${filename}`;
    }
    getContainerClient(containerName) {
        return this.blobServiceClient.getContainerClient(containerName);
    }
    decodeDataUrl(dataUrl) {
        const match = /^data:([^;]+);base64,(.+)$/.exec(dataUrl);
        if (!match) {
            throw new common_1.InternalServerErrorException('Invalid data URL format');
        }
        const contentType = match[1];
        const buffer = Buffer.from(match[2], 'base64');
        return { contentType, buffer };
    }
    extensionFromMime(mime) {
        const map = {
            'image/jpeg': '.jpg',
            'image/jpg': '.jpg',
            'image/png': '.png',
            'image/gif': '.gif',
            'image/webp': '.webp',
            'image/heic': '.heic',
        };
        return map[mime] ?? '.jpg';
    }
};
exports.AzureStorageService = AzureStorageService;
exports.AzureStorageService = AzureStorageService = AzureStorageService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], AzureStorageService);
//# sourceMappingURL=azure-storage.service.js.map