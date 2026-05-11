import { IsBooleanString, IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class BeneficiaryQueryDto {
  @ApiPropertyOptional({ description: 'Free-text search on full_name.' })
  @IsOptional()
  @IsString()
  q?: string;

  @ApiPropertyOptional({ description: 'Filter by community.' })
  @IsOptional()
  @IsString()
  community?: string;

  @ApiPropertyOptional({ description: 'Filter by cohort code.' })
  @IsOptional()
  @IsString()
  cohort?: string;

  @ApiPropertyOptional({
    description:
      'Include inactive (soft-deleted) records. Defaults to false; admin/me_staff only.',
  })
  @IsOptional()
  @IsBooleanString()
  include_inactive?: string;
}
