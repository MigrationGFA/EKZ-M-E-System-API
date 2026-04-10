import { IsString, IsOptional, IsUUID, IsIn, IsObject } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateAuditDto {
  @ApiProperty()
  @IsUUID()
  user_id: string;

  @ApiProperty({ example: 'Adebola Johnson' })
  @IsString()
  user_name: string;

  @ApiProperty({
    enum: ['create', 'update', 'delete', 'login', 'logout', 'submit'],
  })
  @IsIn(['create', 'update', 'delete', 'login', 'logout', 'submit'])
  action: string;

  @ApiProperty({ example: 'indicator' })
  @IsString()
  resource: string;

  @ApiProperty({ example: 'uuid-of-resource' })
  @IsString()
  resource_id: string;

  @ApiPropertyOptional({ example: { status: 'on_track' } })
  @IsOptional()
  @IsObject()
  before?: Record<string, any> | null;

  @ApiPropertyOptional({ example: { status: 'at_risk' } })
  @IsOptional()
  @IsObject()
  after?: Record<string, any> | null;
}
