import {
  IsUUID,
  IsObject,
  IsOptional,
  IsDateString,
  ValidateNested,
  IsNumber,
} from 'class-validator';
import { Type } from 'class-transformer';

class LocationDto {
  @IsNumber()
  lat: number;

  @IsNumber()
  lng: number;
}

export class CreateSubmissionDto {
  @IsUUID()
  id: string;

  @IsUUID()
  formId: string;

  @IsUUID()
  officerId: string;

  @IsObject()
  data: Record<string, any>;

  @IsOptional()
  @ValidateNested()
  @Type(() => LocationDto)
  location?: { lat: number; lng: number } | null;

  @IsDateString()
  submittedAt: string;
}
