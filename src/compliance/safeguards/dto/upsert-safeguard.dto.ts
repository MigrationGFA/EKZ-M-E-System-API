import {
  IsString,
  IsOptional,
  IsInt,
  IsNumber,
  IsIn,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export const SAFEGUARD_TYPES = ['esmp', 'rap', 'other'] as const;

export class UpsertSafeguardDto {
  @ApiProperty({ enum: SAFEGUARD_TYPES })
  @IsString()
  @IsIn(SAFEGUARD_TYPES as unknown as string[])
  type: string;

  @ApiProperty({ example: 'Erosion-control & sediment management plan' })
  @IsString()
  measure_name: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(0)
  total_count?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(0)
  not_started_count?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(0)
  ongoing_count?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(0)
  completed_count?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  budget_allocated_ua?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  amount_disbursed_ua?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  order?: number;
}
