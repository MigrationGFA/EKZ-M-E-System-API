import {
  IsString,
  IsOptional,
  IsUUID,
  IsIn,
  IsObject,
  IsDateString,
  MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { DOCUMENT_TYPES } from '../constants/document-types.js';
import type { DocumentType } from '../evidence-document.entity.js';

/**
 * Server-side create payload. The file itself is uploaded separately via
 * `POST /api/uploads/document`; this DTO carries the resulting file
 * descriptor (`file_url` + `sha256` + `mime_type` + `file_size_bytes`)
 * plus the per-type metadata blob.
 *
 * Per-type metadata is validated dynamically against
 * DOCUMENT_TYPE_CONFIG[document_type].requiredMetadataFields in the
 * service layer — the JSONB column accepts any shape, but the service
 * enforces required keys and surfaces a 422 on miss.
 */
export class CreateEvidenceDto {
  @ApiProperty({ description: 'Document title', maxLength: 500 })
  @IsString()
  @MaxLength(500)
  title: string;

  @ApiPropertyOptional({ description: 'Free-text description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    description: 'Document type (locked 18-value enum per ADR 0005)',
    enum: DOCUMENT_TYPES,
  })
  @IsIn(DOCUMENT_TYPES as readonly string[])
  document_type: DocumentType;

  @ApiPropertyOptional({
    description: 'Per-type metadata. Required fields depend on document_type.',
  })
  @IsOptional()
  @IsObject()
  type_metadata?: Record<string, unknown>;

  @ApiPropertyOptional({
    description: 'Period start (ISO date). Required for time-bound types.',
  })
  @IsOptional()
  @IsDateString()
  reference_period_from?: string;

  @ApiPropertyOptional({
    description: 'Period end (ISO date). Required for time-bound types.',
  })
  @IsOptional()
  @IsDateString()
  reference_period_to?: string;

  @ApiProperty({ description: 'Public URL returned by the upload endpoint' })
  @IsString()
  file_url: string;

  @ApiProperty({ description: 'File size in bytes' })
  @IsString()
  file_size_bytes: string;

  @ApiProperty({ description: 'MIME type recorded at upload time' })
  @IsString()
  @MaxLength(100)
  mime_type: string;

  @ApiProperty({ description: 'SHA-256 hex digest of the uploaded bytes' })
  @IsString()
  @MaxLength(64)
  sha256: string;

  @ApiPropertyOptional({
    description:
      'Optional override of the default retention timestamp. ISO string.',
  })
  @IsOptional()
  @IsDateString()
  retention_until?: string;

  @ApiPropertyOptional({
    description: 'Attach to an indicator (mutually exclusive with the others)',
  })
  @IsOptional()
  @IsUUID()
  indicator_id?: string;

  @ApiPropertyOptional({ description: 'Attach to an indicator-progress row' })
  @IsOptional()
  @IsUUID()
  indicator_progress_id?: string;

  @ApiPropertyOptional({ description: 'Attach to a project location' })
  @IsOptional()
  @IsUUID()
  location_id?: string;
}
