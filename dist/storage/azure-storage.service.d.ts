import { ConfigService } from '@nestjs/config';
export declare class AzureStorageService {
    private readonly config;
    private readonly logger;
    private readonly blobServiceClient;
    constructor(config: ConfigService);
    uploadBase64Image(containerName: string, submissionId: string, fieldId: string, dataUrl: string): Promise<string>;
    uploadDocument(containerName: string, key: string, buffer: Buffer, contentType: string): Promise<string>;
    private saveDocumentLocally;
    private saveLocally;
    private getContainerClient;
    private decodeDataUrl;
    private extensionFromMime;
}
