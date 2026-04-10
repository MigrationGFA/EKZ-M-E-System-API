import { IsString, IsOptional, IsInt, IsIn, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateNodeDto {
  @ApiProperty({
    enum: ['goal', 'outcome', 'output', 'activity'],
    example: 'output',
  })
  @IsIn(['goal', 'outcome', 'output', 'activity'])
  type: string;

  @ApiProperty({ example: 'OP-1.3' })
  @IsString()
  code: string;

  @ApiProperty({ example: 'TVET infrastructure upgraded' })
  @IsString()
  title: string;

  @ApiPropertyOptional({ example: 'Covers 12 LGAs in Ekiti State' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    description: 'UUID of the parent node. Null for goal nodes.',
    example: null,
  })
  @IsOptional()
  @IsUUID()
  parent_id?: string | null;

  @ApiPropertyOptional({ example: 3, default: 0 })
  @IsOptional()
  @IsInt()
  order?: number;
}
