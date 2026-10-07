import { User } from '../users/user.entity.js';
export declare class Form {
    id: string;
    title: string;
    description: string;
    fields: any[];
    field_mappings: Array<{
        form_field_id: string;
        indicator_id: string;
        transform?: 'latest' | 'sum' | 'average';
        axis?: 'sex' | 'age_band' | 'cohort' | 'skill_level';
        beneficiary_attr?: 'sex' | 'age_band' | 'cohort' | 'skill_level';
        static_bucket?: string;
    }>;
    indicator_ids: string[];
    assigned_to: string[];
    location_ids: string[];
    require_gps: boolean;
    created_by: string;
    creator: User;
    status: string;
    created_at: Date;
    updated_at: Date;
}
