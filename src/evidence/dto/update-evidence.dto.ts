import {
  IsString,
  IsOptional,
  IsObject,
  IsDateString,
  MaxLength,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

/** Metadata-only patch. The blob itself is replaced via the multipart
 *  `PATCH /api/evidence/:id/replace` route, not this DTO. */
export class UpdateEvidenceDto {
  @ApiPropertyOptional({ description: 'Document title', maxLength: 500 })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  title?: string;

  @ApiPropertyOptional({ description: 'Free-text description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Per-type metadata' })
  @IsOptional()
  @IsObject()
  type_metadata?: Record<string, unknown>;

  @ApiPropertyOptional({ description: 'Period start (ISO date)' })
  @IsOptional()
  @IsDateString()
  reference_period_from?: string;

  @ApiPropertyOptional({ description: 'Period end (ISO date)' })
  @IsOptional()
  @IsDateString()
  reference_period_to?: string;

  @ApiPropertyOptional({ description: 'Retention timestamp override' })
  @IsOptional()
  @IsDateString()
  retention_until?: string;
}
