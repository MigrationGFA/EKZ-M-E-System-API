import { Controller, Post, Body, Request } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { Roles } from '../auth/roles.decorator.js';
import { UserRole } from '../common/enums/user-role.enum.js';
import { AzureStorageService } from './azure-storage.service.js';
import { UploadImageDto } from './dto/upload-image.dto.js';

@ApiTags('Uploads')
@ApiBearerAuth('JWT')
@Controller('uploads')
export class UploadsController {
  constructor(private readonly azureStorage: AzureStorageService) {}

  @Post('image')
  @Roles(UserRole.ADMIN, UserRole.ME_STAFF, UserRole.PROGRAMME_STAFF)
  @Throttle({ default: { ttl: 60000, limit: 30 } })
  @ApiOperation({
    summary: 'Upload a photo field to Azure Blob Storage',
    description:
      'Accepts a base64 image data URL, uploads it to the images container, ' +
      'and returns the public blob URL. Blob path is deterministic ' +
      '(submissions/{submissionId}/{fieldId}.jpg) so retries are idempotent.',
  })
  @ApiResponse({
    status: 201,
    description: '{ url: string } — public Azure blob URL',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid data URL or payload too large',
  })
  @ApiResponse({ status: 500, description: 'Azure upload failed' })
  async uploadImage(
    @Body() dto: UploadImageDto,
    @Request() _req: unknown,
  ): Promise<{ url: string }> {
    const containerName = process.env.AZURE_CONTAINER_IMAGES ?? 'wiftimages';
    const url = await this.azureStorage.uploadBase64Image(
      containerName,
      dto.submissionId,
      dto.fieldId,
      dto.base64,
    );
    return { url };
  }
}
