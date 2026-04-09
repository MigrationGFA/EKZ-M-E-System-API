import {
  IsString,
  IsNumber,
  IsOptional,
  IsIn,
  IsArray,
  IsUUID,
} from 'class-validator';

export class UpdateIndicatorDto {
  @IsOptional()
  @IsString()
  code?: string;

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsIn(['impact', 'outcome', 'output'])
  level?: string;

  @IsOptional()
  @IsString()
  unit?: string;

  @IsOptional()
  @IsNumber()
  baseline?: number;

  @IsOptional()
  @IsNumber()
  target?: number;

  @IsOptional()
  @IsNumber()
  current_value?: number;

  @IsOptional()
  @IsIn(['monthly', 'quarterly', 'bi_annually', 'annually'])
  frequency?: string;

  @IsOptional()
  @IsUUID()
  logframe_level_id?: string | null;

  @IsOptional()
  @IsArray()
  sdg_ids?: number[];

  @IsOptional()
  @IsString()
  responsible_party?: string;

  @IsOptional()
  @IsString()
  means_of_verification?: string;
}
