export declare const AWP_STATUSES: readonly ["pending_initiation", "in_progress", "finalized", "cancelled"];
export declare class UpsertAwpStatusDto {
    status?: string;
    pct_achievement?: number;
    comments?: string;
    planned_for_next_qtr?: boolean;
    deadline?: string;
}
