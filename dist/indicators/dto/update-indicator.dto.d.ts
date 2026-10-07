export declare class UpdateIndicatorDto {
    code?: string;
    name?: string;
    description?: string;
    level?: string;
    kind?: string;
    unit?: string;
    baseline?: number;
    target?: number;
    current_value?: number;
    frequency?: string;
    methodology?: string;
    rmf_adoa?: boolean;
    target_mode?: string;
    data_source_type?: string;
    reporting_year_start?: number;
    reporting_year_end?: number;
    logframe_level_id?: string | null;
    sdg_ids?: number[];
    responsible_party?: string;
    means_of_verification?: string;
}
