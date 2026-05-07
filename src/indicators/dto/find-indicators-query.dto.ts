import {
  IsOptional,
  IsString,
  IsIn,
  IsBoolean,
  IsNumberString,
  IsUUID,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

const KINDS = ['alignment', 'outcome', 'output', 'activity'] as const;
const FREQUENCIES = [
  'monthly',
  'quarterly',
  'bi_annually',
  'annually',
  'mid_term',
  'one_off',
] as const;
const DATA_SOURCE_TYPES = [
  'form_submission',
  'tracer_study',
  'contractor_report',
  'financial_statement',
  'policy_document',
  'external_feed',
  'manual',
] as const;
const STATUSES = ['on_track', 'at_risk', 'off_track'] as const;

export class FindIndicatorsQueryDto {
  @ApiPropertyOptional({ enum: STATUSES })
  @IsOptional()
  @IsIn(STATUSES as unknown as string[])
  status?: string;

  @ApiPropertyOptional({ description: 'Filter by logframe node UUID' })
  @IsOptional()
  @IsUUID()
  logframe_level_id?: string;

  @ApiPropertyOptional({ type: Number })
  @IsOptional()
  @IsNumberString()
  sdg_id?: string;

  @ApiPropertyOptional({ enum: FREQUENCIES })
  @IsOptional()
  @IsIn(FREQUENCIES as unknown as string[])
  frequency?: string;

  @ApiPropertyOptional({
    enum: KINDS,
    description: 'AfDB RBM discriminator',
  })
  @IsOptional()
  @IsIn(KINDS as unknown as string[])
  kind?: string;

  @ApiPropertyOptional({
    type: Boolean,
    description: 'Filter to RMF/ADoA-rolled-up indicators only',
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true' || value === '1' || value === true) return true;
    if (value === 'false' || value === '0' || value === false) return false;
    return value;
  })
  @IsBoolean()
  rmf_adoa?: boolean;

  @ApiPropertyOptional({ enum: DATA_SOURCE_TYPES })
  @IsOptional()
  @IsIn(DATA_SOURCE_TYPES as unknown as string[])
  data_source_type?: string;

  @ApiPropertyOptional({ description: 'Search by name or code (ILIKE)' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ type: Number })
  @IsOptional()
  @IsNumberString()
  page?: string;

  @ApiPropertyOptional({ type: Number })
  @IsOptional()
  @IsNumberString()
  per_page?: string;
}
