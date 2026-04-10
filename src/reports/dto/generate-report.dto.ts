import { IsString, IsOptional, IsArray, IsUUID, IsIn } from 'class-validator';
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
}
