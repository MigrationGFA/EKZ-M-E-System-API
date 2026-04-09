import {
  IsString,
  IsOptional,
  IsNumber,
  IsArray,
  IsUUID,
  IsInt,
} from 'class-validator';

export class UpdateLocationDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  sector?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsNumber()
  lat?: number;

  @IsOptional()
  @IsNumber()
  lng?: number;

  @IsOptional()
  @IsInt()
  radius_m?: number;

  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  indicator_ids?: string[];
}
