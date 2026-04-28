import {
  IsIn,
  IsOptional,
  IsString,
  MinLength,
  ValidateIf,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ValidateSubmissionDto {
  @ApiProperty({ enum: ['approve', 'reject'], example: 'approve' })
  @IsIn(['approve', 'reject'])
  action: string;

  // Required and must be at least 10 chars when rejecting; optional on approve
  @ValidateIf((o) => o.action === 'reject')
  @IsString()
  @MinLength(10, { message: 'Rejection reason must be at least 10 characters' })
  @ApiPropertyOptional({
    example: 'GPS coordinates are outside the project boundary.',
  })
  @IsOptional()
  comment?: string;
}
