import {
  IsString,
  IsInt,
  IsOptional,
  IsUUID,
  IsDateString,
  Min,
  Max,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UpsertProjectMetaDto {
  @ApiProperty({ example: 'Ekiti Knowledge Zone Project' })
  @IsString()
  name: string;

  @ApiPropertyOptional({
    example: 'P-NG-K00-009',
    description: 'AfDB SAP code for the project',
  })
  @IsOptional()
  @IsString()
  sap_code?: string;

  @ApiProperty({
    example:
      'To promote knowledge economy value chain through innovation and entrepreneurship in technology industry.',
  })
  @IsString()
  pdo_text: string;

  @ApiProperty({ example: 2022, minimum: 2000, maximum: 2100 })
  @IsInt()
  @Min(2000)
  @Max(2100)
  baseline_year: number;

  @ApiProperty({ example: 2028, minimum: 2000, maximum: 2100 })
  @IsInt()
  @Min(2000)
  @Max(2100)
  completion_year: number;

  @ApiPropertyOptional({
    example: '2025-06-30',
    description: 'Project midpoint date (ISO format YYYY-MM-DD)',
  })
  @IsOptional()
  @IsDateString()
  midpoint_date?: string;

  @ApiPropertyOptional({
    description:
      'UUID of the PDO logframe node. Must reference an existing node of type "pdo".',
  })
  @IsOptional()
  @IsUUID()
  pdo_node_id?: string | null;
}
