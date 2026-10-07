export declare const SAFEGUARD_TYPES: readonly ["esmp", "rap", "other"];
export declare class UpsertSafeguardDto {
    type: string;
    measure_name: string;
    total_count?: number;
    not_started_count?: number;
    ongoing_count?: number;
    completed_count?: number;
    budget_allocated_ua?: number;
    amount_disbursed_ua?: number;
    order?: number;
}
