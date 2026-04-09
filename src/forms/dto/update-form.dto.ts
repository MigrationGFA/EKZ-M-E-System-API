import { IsString, IsOptional, IsArray, IsUUID, IsIn } from 'class-validator';

export class UpdateFormDto {
  @IsOptional()
  @IsString()
  title?: string;

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

  @IsOptional()
  @IsIn(['draft', 'published'])
  status?: string;
}
