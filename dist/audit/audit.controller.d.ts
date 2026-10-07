import { AuditService } from './audit.service.js';
import { CreateAuditDto } from './dto/create-audit.dto.js';
export declare class AuditController {
    private readonly auditService;
    constructor(auditService: AuditService);
    findAll(user_id?: string, action?: string, resource?: string, resource_id?: string, from?: string, to?: string, page?: string, per_page?: string): Promise<{
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
    create(dto: CreateAuditDto): Promise<{
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
}
