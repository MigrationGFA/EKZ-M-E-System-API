export type PiiAccessAction = 'view' | 'export' | 'update' | 'withdraw' | 'create' | 'delete';
export declare class PiiAccessLog {
    id: string;
    user_id: string;
    user_email: string;
    beneficiary_id: string | null;
    action: PiiAccessAction;
    reason: string | null;
    request_id: string | null;
    ip_address: string | null;
    user_agent: string | null;
    accessed_at: Date;
}
