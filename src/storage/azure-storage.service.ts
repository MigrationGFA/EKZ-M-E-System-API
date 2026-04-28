import {
  Injectable,
  Logger,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BlobServiceClient, ContainerClient } from '@azure/storage-blob';

@Injectable()
export class AzureStorageService {
  private readonly logger = new Logger(AzureStorageService.name);
  private readonly blobServiceClient: BlobServiceClient;

  constructor(private readonly config: ConfigService) {
    const connectionString = this.config.get<string>(
      'AZURE_STORAGE_CONNECTION_STRING',
    );
    if (!connectionString) {
      throw new Error('AZURE_STORAGE_CONNECTION_STRING is not configured');
    }
    this.blobServiceClient =
      BlobServiceClient.fromConnectionString(connectionString);
  }

  /**
   * Uploads a base64 data URL to the given container.
   * Blob path is deterministic: re-uploading the same submissionId/fieldId
   * overwrites the same blob — safe for retry.
   *
   * Returns the full public HTTPS URL of the uploaded blob.
   */
  async uploadBase64Image(
    containerName: string,
    submissionId: string,
    fieldId: string,
    dataUrl: string,
  ): Promise<string> {
    const { contentType, buffer } = this.decodeDataUrl(dataUrl);
    const extension = this.extensionFromMime(contentType);
    const blobName = `submissions/${submissionId}/${fieldId}${extension}`;

    const containerClient = this.getContainerClient(containerName);
    const blockBlobClient = containerClient.getBlockBlobClient(blobName);

    try {
      await blockBlobClient.uploadData(buffer, {
        blobHTTPHeaders: { blobContentType: contentType },
      });
    } catch (err) {
      this.logger.error(
        `Azure upload failed — container: ${containerName}, blob: ${blobName}`,
        err instanceof Error ? err.stack : String(err),
      );
      throw new InternalServerErrorException('Image upload to storage failed');
    }

    this.logger.log(`Uploaded blob: ${blobName} (${buffer.length} bytes)`);
    return blockBlobClient.url;
  }

  // ── Private helpers ──────────────────────────────────────────────────────────

  private getContainerClient(containerName: string): ContainerClient {
    return this.blobServiceClient.getContainerClient(containerName);
  }

  private decodeDataUrl(dataUrl: string): {
    contentType: string;
    buffer: Buffer;
  } {
    // Expected format: "data:<mime>;base64,<data>"
    const match = /^data:([^;]+);base64,(.+)$/.exec(dataUrl);
    if (!match) {
      throw new InternalServerErrorException('Invalid data URL format');
    }
    const contentType = match[1];
    const buffer = Buffer.from(match[2], 'base64');
    return { contentType, buffer };
  }

  private extensionFromMime(mime: string): string {
    const map: Record<string, string> = {
      'image/jpeg': '.jpg',
      'image/jpg': '.jpg',
      'image/png': '.png',
      'image/gif': '.gif',
      'image/webp': '.webp',
      'image/heic': '.heic',
    };
    return map[mime] ?? '.jpg';
  }
}
