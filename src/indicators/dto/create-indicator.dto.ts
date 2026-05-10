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
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

const LEVELS = [
  'alignment',
  'impact',
  'outcome',
  'output',
  'activity',
] as const;
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

export class CreateIndicatorDto {
  @ApiProperty({ example: 'OUT-1.1' })
  @IsString()
  code: string;

  @ApiProperty({ example: 'Number of youths completing technical training' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'Measures completion of TVET programmes by youth' })
  @IsString()
  description: string;

  @ApiProperty({ enum: LEVELS, example: 'output' })
  @IsIn(LEVELS as unknown as string[])
  level: string;

  @ApiPropertyOptional({
    enum: KINDS,
    default: 'output',
    description:
      'AfDB RBM discriminator. Defaults to "output". Used together with `code` for uniqueness so e.g. Outcome 1.1 and Output 1.1 may coexist.',
  })
  @IsOptional()
  @IsIn(KINDS as unknown as string[])
  kind?: string;

  @ApiProperty({ example: 'individuals' })
  @IsString()
  unit: string;

  @ApiPropertyOptional({ example: 0, default: 0 })
  @IsOptional()
  @IsNumber()
  baseline?: number;

  @ApiProperty({ example: 5000 })
  @IsNumber()
  target: number;

  @ApiProperty({ enum: FREQUENCIES, example: 'quarterly' })
  @IsIn(FREQUENCIES as unknown as string[])
  frequency: string;

  @ApiPropertyOptional({
    description:
      'Free-text methodology / measurement notes from the Monitoring Plan.',
  })
  @IsOptional()
  @IsString()
  methodology?: string;

  @ApiPropertyOptional({
    description:
      'True if the indicator rolls up into the AfDB Results Measurement Framework / ADoA reporting.',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  rmf_adoa?: boolean;

  @ApiPropertyOptional({
    enum: TARGET_MODES,
    default: 'cumulative',
    description:
      'How year targets accumulate. `binary` covers Yes/No indicators (e.g. policy operationalised).',
  })
  @IsOptional()
  @IsIn(TARGET_MODES as unknown as string[])
  target_mode?: string;

  @ApiPropertyOptional({
    enum: DATA_SOURCE_TYPES,
    default: 'form_submission',
    description:
      'Drives UI affordances. `external_feed` indicators do not auto-populate from form submissions.',
  })
  @IsOptional()
  @IsIn(DATA_SOURCE_TYPES as unknown as string[])
  data_source_type?: string;

  @ApiPropertyOptional({
    example: 2023,
    description:
      'First reporting year. Defaults at runtime to project baseline year if omitted.',
  })
  @IsOptional()
  @IsInt()
  reporting_year_start?: number;

  @ApiPropertyOptional({
    example: 2028,
    description:
      'Last reporting year. Defaults at runtime to project completion year if omitted.',
  })
  @IsOptional()
  @IsInt()
  reporting_year_end?: number;

  @ApiPropertyOptional({
    description: 'UUID of the logframe node this indicator is linked to',
    nullable: true,
  })
  @IsOptional()
  @IsUUID()
  logframe_level_id?: string | null;

  @ApiPropertyOptional({ type: [Number], example: [4, 8] })
  @IsOptional()
  @IsArray()
  sdg_ids?: number[];

  @ApiProperty({ example: 'TVET Directorate' })
  @IsString()
  responsible_party: string;

  @ApiProperty({ example: 'Training completion certificates' })
  @IsString()
  means_of_verification: string;

  // Accepted but ignored — status is auto-computed, current_value defaults to baseline
  @ApiPropertyOptional({
    description: 'Ignored on create — auto-computed from baseline/target ratio',
  })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({
    description: 'Ignored on create — defaults to baseline value',
  })
  @IsOptional()
  @IsNumber()
  current_value?: number;
}
