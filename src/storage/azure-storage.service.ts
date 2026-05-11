import { promises as fs } from 'node:fs';
import * as path from 'node:path';
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
  private readonly blobServiceClient: BlobServiceClient | null;

  constructor(private readonly config: ConfigService) {
    const connectionString = this.config.get<string>(
      'AZURE_STORAGE_CONNECTION_STRING',
    );
    if (connectionString) {
      this.blobServiceClient =
        BlobServiceClient.fromConnectionString(connectionString);
    } else {
      this.logger.warn(
        'AZURE_STORAGE_CONNECTION_STRING is not set — uploads will be saved to local disk',
      );
      this.blobServiceClient = null;
    }
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
    } catch (err) {
      this.logger.error(
        `Azure upload failed — container: ${containerName}, blob: ${blobName}`,
        err instanceof Error ? err.stack : String(err),
      );
      throw new InternalServerErrorException('Image upload to storage failed');
    }
  }

  /**
   * Uploads a document buffer (PDF / image / office / csv / zip) to the given
   * container. Unlike `uploadBase64Image`, this expects an already-decoded
   * binary buffer and a deterministic key — the caller is responsible for
   * the key namespace (e.g. `documents/{uuid}/{filename}`).
   *
   * Returns the full public HTTPS URL of the uploaded blob.
   */
  async uploadDocument(
    containerName: string,
    key: string,
    buffer: Buffer,
    contentType: string,
  ): Promise<string> {
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
    } catch (err) {
      this.logger.error(
        `Azure document upload failed — container: ${containerName}, key: ${key}`,
        err instanceof Error ? err.stack : String(err),
      );
      throw new InternalServerErrorException(
        'Document upload to storage failed',
      );
    }
  }

  // ── Private helpers ──────────────────────────────────────────────────────────

  private async saveDocumentLocally(
    key: string,
    buffer: Buffer,
  ): Promise<string> {
    const dir = path.resolve(process.cwd(), 'uploads', path.dirname(key));
    await fs.mkdir(dir, { recursive: true });
    const fullPath = path.join(process.cwd(), 'uploads', key);
    await fs.writeFile(fullPath, buffer);
    const base =
      process.env.APP_URL ?? `http://localhost:${process.env.PORT ?? 3000}`;
    this.logger.warn(`Azure not configured — saved locally: uploads/${key}`);
    return `${base}/uploads/${key}`;
  }

  private async saveLocally(
    submissionId: string,
    fieldId: string,
    extension: string,
    buffer: Buffer,
  ): Promise<string> {
    const dir = path.resolve(
      process.cwd(),
      'uploads',
      'submissions',
      submissionId,
    );
    await fs.mkdir(dir, { recursive: true });
    const filename = `${fieldId}${extension}`;
    await fs.writeFile(path.join(dir, filename), buffer);
    const base =
      process.env.APP_URL ?? `http://localhost:${process.env.PORT ?? 3000}`;
    this.logger.warn(
      `Azure not configured — saved locally: uploads/submissions/${submissionId}/${filename}`,
    );
    return `${base}/uploads/submissions/${submissionId}/${filename}`;
  }

  private getContainerClient(containerName: string): ContainerClient {
    return this.blobServiceClient!.getContainerClient(containerName);
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
