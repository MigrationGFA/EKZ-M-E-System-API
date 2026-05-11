import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Request,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import type { Request as ExpressRequest } from 'express';
import { memoryStorage } from 'multer';
import { Roles } from '../auth/roles.decorator.js';
import { UserRole } from '../common/enums/user-role.enum.js';
import { AzureStorageService } from '../storage/azure-storage.service.js';
import { EvidenceService } from './evidence.service.js';
import { CreateEvidenceDto } from './dto/create-evidence.dto.js';
import { UpdateEvidenceDto } from './dto/update-evidence.dto.js';
import { QueryEvidenceDto } from './dto/query-evidence.dto.js';
import { sha256Hex } from './helpers/sha256.js';
import type { ActorContext } from './helpers/assert-read-access.js';
import { randomUUID } from 'node:crypto';

type AuthedRequest = ExpressRequest & {
  user: ActorContext & { email: string };
};

const FIFTY_MB = 50 * 1024 * 1024;

@ApiTags('Evidence')
@ApiBearerAuth('JWT')
@Controller()
export class EvidenceController {
  constructor(
    private readonly service: EvidenceService,
    private readonly azureStorage: AzureStorageService,
  ) {}

  // ── Multipart upload — returns the uploaded blob descriptor ───────────────

  @Post('uploads/document')
  @Roles(UserRole.ADMIN, UserRole.ME_STAFF, UserRole.PROGRAMME_STAFF)
  @Throttle({ default: { ttl: 60000, limit: 20 } })
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: FIFTY_MB },
    }),
  )
  @ApiOperation({
    summary: 'Upload a document blob (multipart). Returns the blob descriptor.',
    description:
      'Streams the file to Azure container `wiftdocuments` (or local disk fallback). ' +
      'Returns the public URL plus SHA-256, size, and detected MIME — pass these ' +
      'fields to POST /api/evidence to persist the metadata row.',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: { file: { type: 'string', format: 'binary' } },
    },
  })
  @ApiResponse({ status: 201, description: 'Upload descriptor' })
  @ApiResponse({ status: 400, description: 'Missing or oversized file' })
  async uploadDocument(
    @UploadedFile() file: Express.Multer.File | undefined,
  ): Promise<{
    file_url: string;
    file_size_bytes: number;
    mime_type: string;
    sha256: string;
  }> {
    if (!file) {
      throw new BadRequestException('No file uploaded under field "file"');
    }
    if (!file.buffer || file.buffer.length === 0) {
      throw new BadRequestException('Uploaded file is empty');
    }

    const containerName =
      process.env.AZURE_CONTAINER_DOCUMENTS ?? 'wiftdocuments';
    const blobId = randomUUID();
    const safeName = sanitiseFilename(file.originalname);
    const key = `documents/${blobId}/${safeName}`;

    const url = await this.azureStorage.uploadDocument(
      containerName,
      key,
      file.buffer,
      file.mimetype,
    );

    return {
      file_url: url,
      file_size_bytes: file.buffer.length,
      mime_type: file.mimetype,
      sha256: sha256Hex(file.buffer),
    };
  }

  // ── CRUD ──────────────────────────────────────────────────────────────────

  @Post('evidence')
  @Roles(UserRole.ADMIN, UserRole.ME_STAFF, UserRole.PROGRAMME_STAFF)
  @ApiOperation({ summary: 'Persist evidence metadata for an uploaded blob' })
  @ApiResponse({ status: 201, description: 'Created' })
  @ApiResponse({ status: 422, description: 'Missing required metadata field' })
  create(@Body() dto: CreateEvidenceDto, @Request() req: AuthedRequest) {
    return this.service.create(dto, req.user, req.user.email);
  }

  @Get('evidence')
  @Roles(
    UserRole.ADMIN,
    UserRole.ME_STAFF,
    UserRole.PROGRAMME_STAFF,
    UserRole.VIEWER,
  )
  @ApiOperation({
    summary: 'List evidence documents',
    description:
      'Per-type read RBAC narrows results: viewers see only external_data_extract, ' +
      'programme staff see their own photo_evidence + policy_document + mou. ' +
      'admin / me_staff see all.',
  })
  findAll(@Query() query: QueryEvidenceDto, @Request() req: AuthedRequest) {
    return this.service.findAll(query, req.user);
  }

  @Get('evidence/:id')
  @Roles(
    UserRole.ADMIN,
    UserRole.ME_STAFF,
    UserRole.PROGRAMME_STAFF,
    UserRole.VIEWER,
  )
  findOne(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Request() req: AuthedRequest,
  ) {
    return this.service.findOne(id, req.user);
  }

  @Patch('evidence/:id')
  @Roles(UserRole.ADMIN, UserRole.ME_STAFF, UserRole.PROGRAMME_STAFF)
  @ApiOperation({ summary: 'Update evidence metadata (file unchanged)' })
  update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateEvidenceDto,
    @Request() req: AuthedRequest,
  ) {
    return this.service.update(id, dto, req.user, req.user.email);
  }

  @Patch('evidence/:id/replace')
  @Roles(UserRole.ADMIN, UserRole.ME_STAFF, UserRole.PROGRAMME_STAFF)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: FIFTY_MB },
    }),
  )
  @ApiOperation({
    summary: 'Replace the file blob; supersedes the previous row',
    description:
      'Returns 409 with both SHAs unless `force=true` is sent as a form field. ' +
      'On force, a new row is inserted with `supersedes_id` set to this one, and ' +
      'this row is soft-deleted. Bytes identical to the existing blob are a no-op.',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
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
  })
  async replace(
    @Param('id', new ParseUUIDPipe()) id: string,
    @UploadedFile() file: Express.Multer.File | undefined,
    @Body()
    body: {
      force?: string;
      title?: string;
      description?: string;
      type_metadata?: string;
    },
    @Request() req: AuthedRequest,
  ) {
    if (!file) {
      throw new BadRequestException('No file uploaded under field "file"');
    }
    if (!file.buffer || file.buffer.length === 0) {
      throw new BadRequestException('Uploaded file is empty');
    }

    const containerName =
      process.env.AZURE_CONTAINER_DOCUMENTS ?? 'wiftdocuments';
    const blobId = randomUUID();
    const safeName = sanitiseFilename(file.originalname);
    const key = `documents/${blobId}/${safeName}`;

    const url = await this.azureStorage.uploadDocument(
      containerName,
      key,
      file.buffer,
      file.mimetype,
    );

    let parsedMetadata: Record<string, unknown> | undefined;
    if (body.type_metadata) {
      try {
        parsedMetadata = JSON.parse(body.type_metadata) as Record<
          string,
          unknown
        >;
      } catch {
        throw new BadRequestException('type_metadata must be valid JSON');
      }
    }

    return this.service.replace(
      id,
      {
        file_url: url,
        file_size_bytes: file.buffer.length,
        mime_type: file.mimetype,
        sha256: sha256Hex(file.buffer),
      },
      req.user,
      req.user.email,
      {
        force: body.force === 'true',
        title: body.title,
        description: body.description,
        type_metadata: parsedMetadata,
      },
    );
  }

  @Delete('evidence/:id')
  @Roles(UserRole.ADMIN, UserRole.ME_STAFF)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Soft-delete an evidence document' })
  remove(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Request() req: AuthedRequest,
  ) {
    return this.service.softDelete(id, req.user, req.user.email);
  }
}

function sanitiseFilename(name: string | undefined): string {
  const safe = (name ?? 'document').replace(/[^a-zA-Z0-9._-]+/g, '_');
  return safe.slice(0, 120) || 'document';
}
