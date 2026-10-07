export declare const AUDIT_STATUSES: readonly ["pending_initiation", "in_progress", "finalized"];
export declare class UpsertAuditFindingDto {
    year: number;
    audit_status?: string;
    key_issue: string;
    corrective_measures?: string;
    comments?: string;
    expected_submission_date?: string;
    order?: number;
}
