import {
  IsString,
  IsNumber,
  IsOptional,
  IsInt,
  IsIn,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export const FINANCING_INSTRUMENTS = [
  'loan',
  'grant',
  'cofinancing',
  'counterpart',
] as const;

export class UpsertFinancingSourceDto {
  @ApiProperty({ example: 'AfDB ADF Grant' })
  @IsString()
  source_name: string;

  @ApiProperty({ enum: FINANCING_INSTRUMENTS })
  @IsString()
  @IsIn(FINANCING_INSTRUMENTS as unknown as string[])
  instrument: string;

  @ApiProperty({ example: 25_000_000 })
  @IsNumber()
  @Min(0)
  total_approved_ua: number;

  @ApiPropertyOptional({ example: 8_400_000, default: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  disbursed_ua?: number;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @IsInt()
  order?: number;
}
