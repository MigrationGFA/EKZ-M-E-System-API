import {
  IsUUID,
  IsObject,
  IsOptional,
  IsDateString,
  ValidateNested,
  IsNumber,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

class LocationDto {
  @ApiProperty({ example: 7.6211 })
  @IsNumber()
  lat: number;

  @ApiProperty({ example: 5.2216 })
  @IsNumber()
  lng: number;
}

export class CreateSubmissionDto {
  @ApiProperty({
    description:
      'Client-generated UUID v4. Must be unique. Used for idempotent offline sync.',
  })
  @IsUUID()
  id: string;

  @ApiProperty({ description: 'UUID of the form being submitted' })
  @IsUUID()
  formId: string;

  @ApiProperty({ description: 'UUID of the field officer submitting' })
  @IsUUID()
  officerId: string;

  @ApiProperty({
    description: 'Key-value pairs using form field labels as keys',
    example: { 'Full Name': 'John Doe', Age: 24 },
  })
  @IsObject()
  data: Record<string, any>;

  @ApiPropertyOptional({
    type: LocationDto,
    nullable: true,
    description: 'GPS coordinates. If provided, geofencing runs server-side.',
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => LocationDto)
  location?: { lat: number; lng: number } | null;

  @ApiProperty({ example: '2026-04-09T10:00:00Z' })
  @IsDateString()
  submittedAt: string;
}
