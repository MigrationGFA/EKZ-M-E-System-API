export declare const UNANTICIPATED_CATEGORIES: readonly ["gender", "climate", "civil_society", "private_sector", "hiv_aids", "other"];
export declare class UnanticipatedResultDto {
    category: string;
    text: string;
}
export declare class UpsertQuarterlyReportDto {
    executive_summary?: string;
    pdo_assessment?: string;
    unanticipated_results?: UnanticipatedResultDto[];
    bank_performance_assessment?: string;
    borrower_performance_assessment?: string;
    cofinancier_performance_assessment?: string;
    pmt_status?: string;
    awp_planned_next_qtr?: string;
}
