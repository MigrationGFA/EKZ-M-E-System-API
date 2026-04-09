import {
  IsUUID,
  IsObject,
  IsOptional,
  IsDateString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

class LocationDto {
  lat: number;
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
