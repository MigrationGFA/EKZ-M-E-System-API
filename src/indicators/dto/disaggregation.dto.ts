import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsObject,
  IsOptional,
  IsString,
  Validate,
  ValidateNested,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum DisaggregationAxis {
  SEX = 'sex',
  AGE_BAND = 'age_band',
  COHORT = 'cohort',
  SKILL_LEVEL = 'skill_level',
  GEOGRAPHY = 'geography',
  UNIVERSITY_ORIGIN = 'university_origin',
}

@ValidatorConstraint({ name: 'numericRecord', async: false })
class NumericRecordConstraint implements ValidatorConstraintInterface {
  validate(value: unknown): boolean {
    if (value === null || value === undefined) return true;
    if (typeof value !== 'object' || Array.isArray(value)) return false;
    for (const v of Object.values(value as Record<string, unknown>)) {
      if (typeof v !== 'number' || !Number.isFinite(v) || v < 0) return false;
    }
    return true;
  }
  defaultMessage(args: ValidationArguments): string {
    return `${args.property} must be an object whose values are finite non-negative numbers`;
  }
}

export class UpsertDisaggregationDto {
  @ApiProperty({
    enum: DisaggregationAxis,
    example: DisaggregationAxis.SEX,
    description: 'Disaggregation axis (Phase 4 / ADR 0003 vocabulary)',
  })
  @IsEnum(DisaggregationAxis)
  axis: DisaggregationAxis;

  @ApiPropertyOptional({
    default: true,
    description: 'Whether progress entries must carry a breakdown on this axis',
  })
  @IsOptional()
  @IsBoolean()
  required?: boolean;

  @ApiPropertyOptional({
    example: { female: 0.4 },
    description:
      'Axis-specific target. Ratios (0..1) for sex/age_band/skill_level; absolute counts for cohort.',
  })
  @IsOptional()
  @IsObject()
  @Validate(NumericRecordConstraint)
  breakdown_target?: Record<string, number>;

  @ApiPropertyOptional({ description: 'Free-text annotation' })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class SetDisaggregationsDto {
  @ApiProperty({
    type: [UpsertDisaggregationDto],
    description:
      'Full set of disaggregation rules for the indicator. Replaces existing rules.',
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpsertDisaggregationDto)
  rules: UpsertDisaggregationDto[];
}

export class ProgressBreakdownDto {
  @ApiProperty({
    enum: DisaggregationAxis,
    example: DisaggregationAxis.SEX,
  })
  @IsEnum(DisaggregationAxis)
  axis: DisaggregationAxis;

  @ApiProperty({
    example: { male: 1200, female: 800 },
    description: 'Numeric splits matching the axis buckets',
  })
  @IsObject()
  @Validate(NumericRecordConstraint)
  value_breakdown: Record<string, number>;
}
