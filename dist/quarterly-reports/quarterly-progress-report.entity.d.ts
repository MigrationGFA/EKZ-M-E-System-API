export interface UnanticipatedResult {
    category: 'gender' | 'climate' | 'civil_society' | 'private_sector' | 'hiv_aids' | 'other';
    text: string;
}
export declare class QuarterlyProgressReport {
    id: string;
    year: number;
    quarter: number;
    executive_summary: string;
    pdo_assessment: string;
    unanticipated_results: UnanticipatedResult[];
    bank_performance_assessment: string;
    borrower_performance_assessment: string;
    cofinancier_performance_assessment: string;
    pmt_status: string;
    awp_planned_next_qtr: string;
    generated_at: Date | null;
    generated_by: string | null;
    created_at: Date;
    updated_at: Date;
}
