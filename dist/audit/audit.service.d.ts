import { Repository } from 'typeorm';
import { AuditEntry } from './audit-entry.entity.js';
export interface AuditLogInput {
    user_id: string;
    user_name: string;
    action: string;
    resource: string;
    resource_id: string;
    before_data?: Record<string, any> | null;
    after_data?: Record<string, any> | null;
}
export declare class AuditService {
    private readonly auditRepo;
    constructor(auditRepo: Repository<AuditEntry>);
    findAll(filters: {
        user_id?: string;
        action?: string;
        resource?: string;
        resource_id?: string;
        from?: string;
        to?: string;
        page?: number;
        per_page?: number;
    }): Promise<{
        data: {
            id: string;
            user_id: string;
            user_name: string;
            action: string;
            resource: string;
            resource_id: string;
            before: Record<string, any> | null;
            after: Record<string, any> | null;
            timestamp: Date;
        }[];
        total: number;
        page: number;
        per_page: number;
    }>;
    create(input: AuditLogInput): Promise<{
        id: string;
        user_id: string;
        user_name: string;
        action: string;
        resource: string;
        resource_id: string;
        before: Record<string, any> | null;
        after: Record<string, any> | null;
        timestamp: Date;
    }>;
    log(input: AuditLogInput): Promise<void>;
    private serialize;
}
