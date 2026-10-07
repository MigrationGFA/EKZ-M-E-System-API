import { CreateBeneficiaryDto } from './create-beneficiary.dto.js';
export declare class BatchBeneficiaryDto {
    items: CreateBeneficiaryDto[];
}
export interface BatchBeneficiaryResult {
    accepted: string[];
    rejected: Array<{
        id: string;
        reason: string;
    }>;
}
