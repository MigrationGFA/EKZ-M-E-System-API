import { IsString, IsOptional, IsInt, IsIn, IsUUID } from 'class-validator';

export class UpdateNodeDto {
  @IsOptional()
  @IsIn(['goal', 'outcome', 'output', 'activity'])
  type?: string;

  @IsOptional()
  @IsString()
  code?: string;

  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsUUID()
  parent_id?: string | null;

  @IsOptional()
  @IsInt()
  order?: number;
}
