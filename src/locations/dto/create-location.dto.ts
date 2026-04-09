import {
  IsString,
  IsOptional,
  IsNumber,
  IsArray,
  IsUUID,
  IsInt,
} from 'class-validator';

export class CreateLocationDto {
  @IsString()
  name: string;

  @IsString()
  sector: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsNumber()
  lat: number;

  @IsNumber()
  lng: number;

  @IsOptional()
  @IsInt()
  radius_m?: number;

  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  indicator_ids?: string[];

  @IsUUID()
  created_by: string;
}
