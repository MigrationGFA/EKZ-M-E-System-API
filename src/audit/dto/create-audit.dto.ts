import { IsString, IsOptional, IsUUID, IsIn, IsObject } from 'class-validator';

export class CreateAuditDto {
  @IsUUID()
  user_id: string;

  @IsString()
  user_name: string;

  @IsIn(['create', 'update', 'delete', 'login', 'logout', 'submit'])
  action: string;

  @IsString()
  resource: string;

  @IsString()
  resource_id: string;

  @IsOptional()
  @IsObject()
  before?: Record<string, any> | null;

  @IsOptional()
  @IsObject()
  after?: Record<string, any> | null;
}
