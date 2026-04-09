import { IsString, IsOptional, IsArray, IsUUID, IsIn } from 'class-validator';

export class GenerateReportDto {
  @IsString()
  title: string;

  @IsIn(['pdf', 'xlsx', 'csv'])
  format: string;

  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  indicator_ids?: string[];

  @IsOptional()
  @IsUUID()
  logframe_level_id?: string | null;

  @IsOptional()
  @IsUUID()
  location_id?: string | null;

  @IsOptional()
  @IsString()
  date_from?: string;

  @IsOptional()
  @IsString()
  date_to?: string;
}
