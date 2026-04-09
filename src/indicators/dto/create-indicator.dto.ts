import {
  IsString,
  IsNumber,
  IsOptional,
  IsIn,
  IsArray,
  IsUUID,
} from 'class-validator';

export class CreateIndicatorDto {
  @IsString()
  code: string;

  @IsString()
  name: string;

  @IsString()
  description: string;

  @IsIn(['impact', 'outcome', 'output'])
  level: string;

  @IsString()
  unit: string;

  @IsOptional()
  @IsNumber()
  baseline?: number;

  @IsNumber()
  target: number;

  @IsIn(['monthly', 'quarterly', 'bi_annually', 'annually'])
  frequency: string;

  @IsOptional()
  @IsUUID()
  logframe_level_id?: string | null;

  @IsOptional()
  @IsArray()
  sdg_ids?: number[];

  @IsString()
  responsible_party: string;

  @IsString()
  means_of_verification: string;
}
