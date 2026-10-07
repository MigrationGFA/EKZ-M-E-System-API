export declare class CreateFormDto {
    title: string;
    description?: string;
    fields?: any[];
    indicator_ids?: string[];
    assigned_to?: string[];
    created_by: string;
    status?: string;
    field_mappings?: Array<{
        form_field_id: string;
        indicator_id: string;
        transform?: 'latest' | 'sum' | 'average';
    }>;
    location_ids?: string[];
    require_gps?: boolean;
}
