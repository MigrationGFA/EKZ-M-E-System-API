import {
  IsString,
  IsNumber,
  IsOptional,
  IsIn,
  IsArray,
  IsUUID,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

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

  @ApiProperty({ enum: ['impact', 'outcome', 'output'], example: 'output' })
  @IsIn(['impact', 'outcome', 'output'])
  level: string;

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

  @ApiProperty({
    enum: ['monthly', 'quarterly', 'bi_annually', 'annually'],
    example: 'quarterly',
  })
  @IsIn(['monthly', 'quarterly', 'bi_annually', 'annually'])
  frequency: string;

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
  @ApiPropertyOptional({ description: 'Ignored on create — auto-computed from baseline/target ratio' })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({ description: 'Ignored on create — defaults to baseline value' })
  @IsOptional()
  @IsNumber()
  current_value?: number;
}
