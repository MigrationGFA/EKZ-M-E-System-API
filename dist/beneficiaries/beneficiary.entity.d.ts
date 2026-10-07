import { User } from '../users/user.entity.js';
import { Cohort } from './cohort.entity.js';
export type BeneficiarySex = 'female' | 'male' | 'other' | 'prefer_not';
export type BeneficiaryAgeBand = 'under_18' | '18_24' | '25_34' | '35_plus';
export type ConsentMethod = 'paper_signature' | 'digital_signature' | 'verbal_recorded' | 'sms_opt_in';
export declare class Beneficiary {
    id: string;
    full_name: string;
    sex: BeneficiarySex;
    date_of_birth: string | null;
    age_band: BeneficiaryAgeBand | null;
    community: string | null;
    household_id: string | null;
    phone_e164: string | null;
    national_id_hash: string | null;
    skill_level: string | null;
    disability_status: boolean;
    notes: string | null;
    consent_given: boolean;
    consent_date: Date | null;
    consent_method: ConsentMethod | null;
    active: boolean;
    withdrawn_at: Date | null;
    created_by: string;
    creator: User;
    cohorts: Cohort[];
    created_at: Date;
    updated_at: Date;
}
