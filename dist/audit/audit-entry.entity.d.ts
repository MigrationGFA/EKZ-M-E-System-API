export declare class AuditEntry {
    id: string;
    user_id: string;
    user_name: string;
    action: string;
    resource: string;
    resource_id: string;
    before_data: Record<string, any> | null;
    after_data: Record<string, any> | null;
    created_at: Date;
}
