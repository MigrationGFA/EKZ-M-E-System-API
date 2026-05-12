import {
  IsString,
  IsOptional,
  IsArray,
  IsIn,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export const UNANTICIPATED_CATEGORIES = [
  'gender',
  'climate',
  'civil_society',
  'private_sector',
  'hiv_aids',
  'other',
] as const;

export class UnanticipatedResultDto {
  @ApiProperty({ enum: UNANTICIPATED_CATEGORIES })
  @IsString()
  @IsIn(UNANTICIPATED_CATEGORIES as unknown as string[])
  category: string;

  @ApiProperty()
  @IsString()
  text: string;
}

export class UpsertQuarterlyReportDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  executive_summary?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  pdo_assessment?: string;

  @ApiPropertyOptional({ type: [UnanticipatedResultDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UnanticipatedResultDto)
  unanticipated_results?: UnanticipatedResultDto[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  bank_performance_assessment?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  borrower_performance_assessment?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  cofinancier_performance_assessment?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  pmt_status?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  awp_planned_next_qtr?: string;
}
