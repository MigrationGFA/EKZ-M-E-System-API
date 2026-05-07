import {
  IsString,
  IsNumber,
  IsInt,
  IsBoolean,
  IsOptional,
  IsIn,
  IsArray,
  IsUUID,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

const LEVELS = ['alignment', 'impact', 'outcome', 'output', 'activity'] as const;
const KINDS = ['alignment', 'outcome', 'output', 'activity'] as const;
const FREQUENCIES = [
  'monthly',
  'quarterly',
  'bi_annually',
  'annually',
  'mid_term',
  'one_off',
] as const;
const TARGET_MODES = ['cumulative', 'incremental', 'binary'] as const;
const DATA_SOURCE_TYPES = [
  'form_submission',
  'tracer_study',
  'contractor_report',
  'financial_statement',
  'policy_document',
  'external_feed',
  'manual',
] as const;

export class UpdateIndicatorDto {
  @ApiPropertyOptional({ example: 'OUT-1.1' })
  @IsOptional()
  @IsString()
  code?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ enum: LEVELS })
  @IsOptional()
  @IsIn(LEVELS as unknown as string[])
  level?: string;

  @ApiPropertyOptional({ enum: KINDS })
  @IsOptional()
  @IsIn(KINDS as unknown as string[])
  kind?: string;

  @ApiPropertyOptional({ example: 'individuals' })
  @IsOptional()
  @IsString()
  unit?: string;

  @ApiPropertyOptional({ example: 0 })
  @IsOptional()
  @IsNumber()
  baseline?: number;

  @ApiPropertyOptional({ example: 5000 })
  @IsOptional()
  @IsNumber()
  target?: number;

  @ApiPropertyOptional({
    example: 3450,
    description: 'Triggers status recomputation',
  })
  @IsOptional()
  @IsNumber()
  current_value?: number;

  @ApiPropertyOptional({ enum: FREQUENCIES })
  @IsOptional()
  @IsIn(FREQUENCIES as unknown as string[])
  frequency?: string;

  @ApiPropertyOptional({
    description: 'Free-text methodology / measurement notes.',
  })
  @IsOptional()
  @IsString()
  methodology?: string;

  @ApiPropertyOptional({
    description:
      'True if the indicator rolls up into AfDB RMF / ADoA reporting.',
  })
  @IsOptional()
  @IsBoolean()
  rmf_adoa?: boolean;

  @ApiPropertyOptional({ enum: TARGET_MODES })
  @IsOptional()
  @IsIn(TARGET_MODES as unknown as string[])
  target_mode?: string;

  @ApiPropertyOptional({ enum: DATA_SOURCE_TYPES })
  @IsOptional()
  @IsIn(DATA_SOURCE_TYPES as unknown as string[])
  data_source_type?: string;

  @ApiPropertyOptional({ example: 2023 })
  @IsOptional()
  @IsInt()
  reporting_year_start?: number;

  @ApiPropertyOptional({ example: 2028 })
  @IsOptional()
  @IsInt()
  reporting_year_end?: number;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsUUID()
  logframe_level_id?: string | null;

  @ApiPropertyOptional({ type: [Number], example: [4, 8] })
  @IsOptional()
  @IsArray()
  sdg_ids?: number[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  responsible_party?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  means_of_verification?: string;
}
