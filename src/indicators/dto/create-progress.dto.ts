import {
  IsArray,
  IsDateString,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ProgressBreakdownDto } from './disaggregation.dto.js';

export class CreateProgressDto {
  @ApiProperty({ example: 3450, description: 'Progress value to record' })
  @IsNumber()
  value: number;

  @ApiProperty({
    example: '2026-04-13T00:00:00Z',
    description: 'Date of the progress entry',
  })
  @IsDateString()
  date: string;

  @ApiPropertyOptional({ example: 'Q1 field verification complete' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiProperty({
    example: 'Funke Ogunleye',
    description: 'Display name of the person logging progress',
  })
  @IsString()
  submittedBy: string;

  @ApiPropertyOptional({
    type: [ProgressBreakdownDto],
    description:
      'Optional per-axis breakdowns (Phase 4 disaggregation). Each axis appears at most once.',
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProgressBreakdownDto)
  breakdowns?: ProgressBreakdownDto[];
}
