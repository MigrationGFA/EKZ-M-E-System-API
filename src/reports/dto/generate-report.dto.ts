import {
  IsString,
  IsOptional,
  IsArray,
  IsUUID,
  IsIn,
  IsInt,
  Min,
  Max,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class GenerateReportDto {
  @ApiProperty({ example: 'Q1 2026 Progress Report' })
  @IsString()
  title: string;

  @ApiProperty({ enum: ['pdf', 'xlsx', 'csv'], example: 'pdf' })
  @IsIn(['pdf', 'xlsx', 'csv'])
  format: string;

  @ApiPropertyOptional({
    type: [String],
    description: 'Filter by specific indicator UUIDs',
  })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  indicator_ids?: string[];

  @ApiPropertyOptional({
    nullable: true,
    description: 'Filter by logframe node UUID',
  })
  @IsOptional()
  @IsUUID()
  logframe_level_id?: string | null;

  @ApiPropertyOptional({
    nullable: true,
    description: 'Filter by project location UUID',
  })
  @IsOptional()
  @IsUUID()
  location_id?: string | null;

  @ApiPropertyOptional({ example: '2026-01-01' })
  @IsOptional()
  @IsString()
  date_from?: string;

  @ApiPropertyOptional({ example: '2026-03-31' })
  @IsOptional()
  @IsString()
  date_to?: string;

  @ApiPropertyOptional({
    example: 2026,
    description:
      'Phase 9.5 — reporting year for the QPR PDF. Defaults to current year when format=pdf and omitted.',
  })
  @IsOptional()
  @IsInt()
  @Min(2000)
  @Max(2100)
  year?: number;

  @ApiPropertyOptional({
    example: 2,
    description:
      'Phase 9.5 — reporting quarter (1-4) for the QPR PDF. Defaults to the quarter of `now` when format=pdf and omitted.',
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(4)
  quarter?: number;
}
