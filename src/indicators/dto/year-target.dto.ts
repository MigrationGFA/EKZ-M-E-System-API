import {
  IsArray,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class YearTargetItemDto {
  @ApiProperty({ example: 2026, description: 'Calendar year (CE)' })
  @IsInt()
  @Min(2000)
  @Max(2100)
  year: number;

  @ApiProperty({
    example: 4500,
    description: 'Target value the indicator should have reached by year end',
  })
  @IsNumber()
  target_value: number;

  @ApiPropertyOptional({
    example: 'Mid-term milestone per Monitoring Plan',
    description: 'Free-text annotation; surfaced in the AfDB report',
  })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class SetYearTargetsDto {
  @ApiProperty({
    type: [YearTargetItemDto],
    description:
      'Full set of year targets for the indicator. Replaces any existing rows.',
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => YearTargetItemDto)
  targets: YearTargetItemDto[];
}
