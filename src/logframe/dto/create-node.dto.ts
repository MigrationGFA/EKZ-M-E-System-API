import { IsString, IsOptional, IsInt, IsIn, IsUUID } from 'class-validator';

export class CreateNodeDto {
  @IsIn(['goal', 'outcome', 'output', 'activity'])
  type: string;

  @IsString()
  code: string;

  @IsString()
  title: string;

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
