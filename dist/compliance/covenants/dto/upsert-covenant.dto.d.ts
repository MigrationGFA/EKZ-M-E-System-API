export declare const COVENANT_TYPES: readonly ["entry_into_force", "first_disbursement", "undertaking"];
export declare const COVENANT_STATUSES: readonly ["pending_initiation", "in_progress", "finalized"];
export declare class UpsertCovenantDto {
    covenant_text: string;
    type: string;
    status?: string;
    comments?: string;
    order?: number;
}
