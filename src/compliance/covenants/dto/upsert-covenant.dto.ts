import { IsString, IsOptional, IsInt, IsIn } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export const COVENANT_TYPES = [
  'entry_into_force',
  'first_disbursement',
  'undertaking',
] as const;

export const COVENANT_STATUSES = [
  'pending_initiation',
  'in_progress',
  'finalized',
] as const;

export class UpsertCovenantDto {
  @ApiProperty({
    example:
      'The Borrower shall maintain an environmental and social management system…',
  })
  @IsString()
  covenant_text: string;

  @ApiProperty({ enum: COVENANT_TYPES })
  @IsString()
  @IsIn(COVENANT_TYPES as unknown as string[])
  type: string;

  @ApiPropertyOptional({ enum: COVENANT_STATUSES })
  @IsOptional()
  @IsString()
  @IsIn(COVENANT_STATUSES as unknown as string[])
  status?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  comments?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  order?: number;
}
