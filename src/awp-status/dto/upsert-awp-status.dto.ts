import {
  IsString,
  IsOptional,
  IsInt,
  IsBoolean,
  IsDateString,
  IsIn,
  Min,
  Max,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export const AWP_STATUSES = [
  'pending_initiation',
  'in_progress',
  'finalized',
  'cancelled',
] as const;

export class UpsertAwpStatusDto {
  @ApiPropertyOptional({ enum: AWP_STATUSES })
  @IsOptional()
  @IsString()
  @IsIn(AWP_STATUSES as unknown as string[])
  status?: string;

  @ApiPropertyOptional({ example: 75, minimum: 0, maximum: 100 })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  pct_achievement?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  comments?: string;

  @ApiPropertyOptional({
    description:
      'Flag this activity as planned for the NEXT quarter (renders in C.2.2 of the QPR PDF).',
  })
  @IsOptional()
  @IsBoolean()
  planned_for_next_qtr?: boolean;

  @ApiPropertyOptional({ example: '2026-09-30' })
  @IsOptional()
  @IsDateString()
  deadline?: string;
}
