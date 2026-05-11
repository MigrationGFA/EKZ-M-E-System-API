import {
  IsOptional,
  IsString,
  IsIn,
  IsUUID,
  IsBooleanString,
  IsInt,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { DOCUMENT_TYPES } from '../constants/document-types.js';
import type { DocumentType } from '../evidence-document.entity.js';

export class QueryEvidenceDto {
  @ApiPropertyOptional({
    description: 'Filter by document_type',
    enum: DOCUMENT_TYPES,
  })
  @IsOptional()
  @IsIn(DOCUMENT_TYPES as readonly string[])
  document_type?: DocumentType;

  @ApiPropertyOptional({ description: 'Filter by attached indicator' })
  @IsOptional()
  @IsUUID()
  indicator_id?: string;

  @ApiPropertyOptional({ description: 'Filter by attached progress row' })
  @IsOptional()
  @IsUUID()
  indicator_progress_id?: string;

  @ApiPropertyOptional({ description: 'Filter by attached project location' })
  @IsOptional()
  @IsUUID()
  location_id?: string;

  @ApiPropertyOptional({ description: 'Only orphan (unattached) docs' })
  @IsOptional()
  @IsBooleanString()
  orphan?: string;

  @ApiPropertyOptional({
    description:
      'Surface documents whose retention_until is past — admin-only filter',
  })
  @IsOptional()
  @IsBooleanString()
  due_for_deletion?: string;

  @ApiPropertyOptional({
    description: 'Include soft-deleted rows (admin-only)',
  })
  @IsOptional()
  @IsBooleanString()
  include_deleted?: string;

  @ApiPropertyOptional({ description: 'Free-text search on title' })
  @IsOptional()
  @IsString()
  q?: string;

  @ApiPropertyOptional({ description: 'Page (1-indexed)', minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({
    description: 'Page size',
    minimum: 1,
    maximum: 100,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  per_page?: number;
}
