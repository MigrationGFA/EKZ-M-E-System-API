import {
  IsString,
  IsOptional,
  IsInt,
  IsIn,
  IsUUID,
  IsNumber,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Allowed node types — see docs/afdb-alignment/decisions/0002-hierarchy.md.
 * Legacy values (goal/outcome/output/activity) remain valid for backward
 * compatibility with existing dev data.
 */
export const NODE_TYPES = [
  'pdo',
  'alignment',
  'component',
  'outcome_statement',
  'output_statement',
  'goal',
  'outcome',
  'output',
  'activity',
] as const;

export class CreateNodeDto {
  @ApiProperty({ enum: NODE_TYPES, example: 'output_statement' })
  @IsIn(NODE_TYPES as unknown as string[])
  type: string;

  @ApiProperty({ example: 'OS-1' })
  @IsString()
  code: string;

  @ApiProperty({ example: 'Innovation Park Developed (Smart Green City)' })
  @IsString()
  title: string;

  @ApiPropertyOptional({ example: 'Component 1 deliverables on the EKZ site' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    description:
      'UUID of the parent node. Null for root types (pdo, legacy goal).',
    example: null,
  })
  @IsOptional()
  @IsUUID()
  parent_id?: string | null;

  @ApiPropertyOptional({ example: 1, default: 0 })
  @IsOptional()
  @IsInt()
  order?: number;

  @ApiPropertyOptional({
    example: 65000000,
    description:
      'Budget envelope in the selected currency. Component nodes only.',
  })
  @IsOptional()
  @IsNumber()
  budget_usd?: number;

  @ApiPropertyOptional({ example: 'USD', default: 'USD' })
  @IsOptional()
  @IsString()
  budget_currency?: string;
}
