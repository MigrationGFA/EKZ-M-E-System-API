import {
  IsString,
  IsOptional,
  IsInt,
  IsIn,
  IsDateString,
  Min,
  Max,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export const AUDIT_STATUSES = [
  'pending_initiation',
  'in_progress',
  'finalized',
] as const;

export class UpsertAuditFindingDto {
  @ApiProperty({ example: 2025, minimum: 2000, maximum: 2100 })
  @IsInt()
  @Min(2000)
  @Max(2100)
  year: number;

  @ApiPropertyOptional({ enum: AUDIT_STATUSES })
  @IsOptional()
  @IsString()
  @IsIn(AUDIT_STATUSES as unknown as string[])
  audit_status?: string;

  @ApiProperty({ example: 'Inadequate segregation of duties in procurement' })
  @IsString()
  key_issue: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  corrective_measures?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  comments?: string;

  @ApiPropertyOptional({ example: '2026-06-30' })
  @IsOptional()
  @IsDateString()
  expected_submission_date?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  order?: number;
}
