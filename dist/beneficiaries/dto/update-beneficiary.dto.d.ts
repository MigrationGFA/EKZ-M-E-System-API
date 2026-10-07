import { CreateBeneficiaryDto } from './create-beneficiary.dto.js';
declare const UpdateBeneficiaryDto_base: import("@nestjs/common").Type<Partial<Omit<CreateBeneficiaryDto, "id" | "cohort_codes">>>;
export declare class UpdateBeneficiaryDto extends UpdateBeneficiaryDto_base {
}
export {};
