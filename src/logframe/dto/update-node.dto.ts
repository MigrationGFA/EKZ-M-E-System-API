import {
  IsString,
  IsOptional,
  IsInt,
  IsIn,
  IsUUID,
  IsNumber,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { NODE_TYPES } from './create-node.dto.js';

export class UpdateNodeDto {
  @ApiPropertyOptional({ enum: NODE_TYPES })
  @IsOptional()
  @IsIn(NODE_TYPES as unknown as string[])
  type?: string;

  @ApiPropertyOptional({ example: 'OS-1' })
  @IsOptional()
  @IsString()
  code?: string;

  @ApiPropertyOptional({ example: 'Innovation Park Developed' })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsUUID()
  parent_id?: string | null;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @IsInt()
  order?: number;

  @ApiPropertyOptional({ example: 65000000 })
  @IsOptional()
  @IsNumber()
  budget_usd?: number;

  @ApiPropertyOptional({ example: 'USD' })
  @IsOptional()
  @IsString()
  budget_currency?: string;
}
