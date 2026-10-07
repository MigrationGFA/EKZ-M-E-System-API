import type { BeneficiaryAgeBand, BeneficiarySex, ConsentMethod } from '../beneficiary.entity.js';
export declare class CreateBeneficiaryDto {
    id?: string;
    full_name: string;
    sex: BeneficiarySex;
    date_of_birth?: string;
    age_band?: BeneficiaryAgeBand;
    community?: string;
    household_id?: string;
    phone_e164?: string;
    national_id_raw?: string;
    skill_level?: string;
    disability_status?: boolean;
    notes?: string;
    consent_given: boolean;
    consent_date?: string;
    consent_method?: ConsentMethod;
    cohort_codes?: string[];
}
