export declare const RISK_STATUSES: readonly ["pending_initiation", "in_progress", "finalized"];
export declare class UpsertRiskDto {
    key_issue: string;
    corrective_action?: string;
    responsibility?: string;
    deadline?: string;
    status?: string;
    comments?: string;
}
