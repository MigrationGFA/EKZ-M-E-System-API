import {
  IsString,
  IsNumber,
  IsOptional,
  IsIn,
  IsArray,
  IsUUID,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

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

  @ApiPropertyOptional({ enum: ['impact', 'outcome', 'output'] })
  @IsOptional()
  @IsIn(['impact', 'outcome', 'output'])
  level?: string;

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

  @ApiPropertyOptional({
    enum: ['monthly', 'quarterly', 'bi_annually', 'annually'],
  })
  @IsOptional()
  @IsIn(['monthly', 'quarterly', 'bi_annually', 'annually'])
  frequency?: string;

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
