import { IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class ReportPreviewQueryDto {
  @ApiPropertyOptional({ example: '2026-01-01' })
  @IsOptional()
  @IsString()
  date_from?: string;

  @ApiPropertyOptional({ example: '2026-03-31' })
  @IsOptional()
  @IsString()
  date_to?: string;
}
