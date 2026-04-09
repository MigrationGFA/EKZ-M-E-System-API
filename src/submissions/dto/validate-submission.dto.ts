import { IsIn, IsOptional, IsString } from 'class-validator';

export class ValidateSubmissionDto {
  @IsIn(['approve', 'reject'])
  action: string;

  @IsOptional()
  @IsString()
  comment?: string;
}
