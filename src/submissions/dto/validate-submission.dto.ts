import { IsIn, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ValidateSubmissionDto {
  @ApiProperty({ enum: ['approve', 'reject'], example: 'approve' })
  @IsIn(['approve', 'reject'])
  action: string;

  @ApiPropertyOptional({ example: 'Verified on-site.' })
  @IsOptional()
  @IsString()
  comment?: string;
}
