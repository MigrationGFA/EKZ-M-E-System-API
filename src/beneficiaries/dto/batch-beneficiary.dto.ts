import { ApiProperty } from '@nestjs/swagger';
import { ArrayMaxSize, ArrayMinSize, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { CreateBeneficiaryDto } from './create-beneficiary.dto.js';

export class BatchBeneficiaryDto {
  @ApiProperty({
    type: [CreateBeneficiaryDto],
    description:
      'Beneficiaries registered offline. Each must include `id` (client UUID) so syncs are idempotent.',
  })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(200)
  @ValidateNested({ each: true })
  @Type(() => CreateBeneficiaryDto)
  items: CreateBeneficiaryDto[];
}

export interface BatchBeneficiaryResult {
  accepted: string[];
  rejected: Array<{ id: string; reason: string }>;
}
