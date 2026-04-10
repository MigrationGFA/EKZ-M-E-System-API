import { IsString, IsOptional, IsArray, IsUUID, IsIn } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateFormDto {
  @ApiProperty({ example: 'Youth Training Enrollment Log' })
  @IsString()
  title: string;

  @ApiPropertyOptional({
    example: 'Records youth enrollment into TVET programmes',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    description: 'Array of field definition objects',
    example: [
      { id: 'f1', label: 'Full Name', type: 'text', required: true, order: 1 },
    ],
  })
  @IsOptional()
  @IsArray()
  fields?: any[];

  @ApiPropertyOptional({
    type: [String],
    description: 'Linked indicator UUIDs',
  })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  indicator_ids?: string[];

  @ApiPropertyOptional({
    type: [String],
    description: 'User UUIDs assigned to this form',
  })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  assigned_to?: string[];

  @ApiProperty({ description: 'UUID of the user who created the form' })
  @IsUUID()
  created_by: string;

  @ApiPropertyOptional({ enum: ['draft', 'published'], default: 'draft' })
  @IsOptional()
  @IsIn(['draft', 'published'])
  status?: string;
}
