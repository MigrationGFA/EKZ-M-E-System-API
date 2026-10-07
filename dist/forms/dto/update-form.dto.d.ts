export declare class UpdateFormDto {
    title?: string;
    description?: string;
    fields?: any[];
    indicator_ids?: string[];
    assigned_to?: string[];
    status?: string;
    field_mappings?: Array<{
        form_field_id: string;
        indicator_id: string;
        transform?: 'latest' | 'sum' | 'average';
    }>;
    location_ids?: string[];
    require_gps?: boolean;
}
