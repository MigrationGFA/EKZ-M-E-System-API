import { IsString, IsOptional, IsDateString, IsIn } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export const RISK_STATUSES = [
  'pending_initiation',
  'in_progress',
  'finalized',
] as const;

export class UpsertRiskDto {
  @ApiProperty({ example: 'Delayed land acquisition for Block C' })
  @IsString()
  key_issue: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  corrective_action?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  responsibility?: string;

  @ApiPropertyOptional({ example: '2026-09-30' })
  @IsOptional()
  @IsDateString()
  deadline?: string;

  @ApiPropertyOptional({ enum: RISK_STATUSES, default: 'pending_initiation' })
  @IsOptional()
  @IsString()
  @IsIn(RISK_STATUSES as unknown as string[])
  status?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  comments?: string;
}
