import { AzureStorageService } from './azure-storage.service.js';
import { UploadImageDto } from './dto/upload-image.dto.js';
export declare class UploadsController {
    private readonly azureStorage;
    constructor(azureStorage: AzureStorageService);
    uploadImage(dto: UploadImageDto, _req: unknown): Promise<{
        url: string;
    }>;
}
