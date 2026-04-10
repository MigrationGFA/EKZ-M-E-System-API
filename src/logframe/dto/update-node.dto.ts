import { IsString, IsOptional, IsInt, IsIn, IsUUID } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateNodeDto {
  @ApiPropertyOptional({ enum: ['goal', 'outcome', 'output', 'activity'] })
  @IsOptional()
  @IsIn(['goal', 'outcome', 'output', 'activity'])
  type?: string;

  @ApiPropertyOptional({ example: 'OP-1.3' })
  @IsOptional()
  @IsString()
  code?: string;

  @ApiPropertyOptional({ example: 'TVET infrastructure upgraded' })
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

  @ApiPropertyOptional({ example: 3 })
  @IsOptional()
  @IsInt()
  order?: number;
}
