import {
  IsString,
  IsOptional,
  IsNumber,
  IsArray,
  IsUUID,
  IsInt,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateLocationDto {
  @ApiProperty({ example: 'EKZ TVET Centre' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'Education' })
  @IsString()
  sector: string;

  @ApiPropertyOptional({ example: 'Main vocational training facility' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: 7.6211, description: 'Latitude in decimal degrees' })
  @IsNumber()
  lat: number;

  @ApiProperty({ example: 5.2216, description: 'Longitude in decimal degrees' })
  @IsNumber()
  lng: number;

  @ApiPropertyOptional({
    example: 500,
    default: 500,
    description: 'Geofence radius in metres',
  })
  @IsOptional()
  @IsInt()
  radius_m?: number;

  @ApiPropertyOptional({
    type: [String],
    description:
      'Linked indicator UUIDs. Used to compute status and completion.',
  })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  indicator_ids?: string[];

  @ApiProperty({ description: 'UUID of the user creating this location' })
  @IsUUID()
  created_by: string;
}
