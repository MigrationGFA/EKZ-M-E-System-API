export declare class GenerateReportDto {
    title: string;
    format: string;
    indicator_ids?: string[];
    logframe_level_id?: string | null;
    location_id?: string | null;
    date_from?: string;
    date_to?: string;
    year?: number;
    quarter?: number;
}
