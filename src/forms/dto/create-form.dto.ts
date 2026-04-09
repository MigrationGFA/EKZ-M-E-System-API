import { IsString, IsOptional, IsArray, IsUUID, IsIn } from 'class-validator';

export class CreateFormDto {
  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsArray()
  fields?: any[];

  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  indicator_ids?: string[];

  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  assigned_to?: string[];

  @IsUUID()
  created_by: string;

  @IsOptional()
  @IsIn(['draft', 'published'])
  status?: string;
}
