export declare class CreateAuditDto {
    user_id: string;
    user_name: string;
    action: string;
    resource: string;
    resource_id: string;
    before?: Record<string, any> | null;
    after?: Record<string, any> | null;
}
