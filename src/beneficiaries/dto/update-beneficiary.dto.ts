import { PartialType, OmitType } from '@nestjs/swagger';
import { CreateBeneficiaryDto } from './create-beneficiary.dto.js';

export class UpdateBeneficiaryDto extends PartialType(
  OmitType(CreateBeneficiaryDto, ['id', 'cohort_codes'] as const),
) {}
