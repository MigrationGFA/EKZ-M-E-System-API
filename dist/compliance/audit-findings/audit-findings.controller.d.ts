import { AuditFindingsService } from './audit-findings.service.js';
import { UpsertAuditFindingDto } from './dto/upsert-audit-finding.dto.js';
import { UserRole } from '../../common/enums/user-role.enum.js';
type JwtReq = {
    user: {
        id: string;
        email: string;
        role: UserRole;
    };
};
export declare class AuditFindingsController {
    private readonly service;
    constructor(service: AuditFindingsService);
    findAll(): Promise<import("./audit-finding.entity.js").AuditFinding[]>;
    create(dto: UpsertAuditFindingDto, req: JwtReq): Promise<import("./audit-finding.entity.js").AuditFinding>;
    update(id: string, dto: UpsertAuditFindingDto, req: JwtReq): Promise<import("./audit-finding.entity.js").AuditFinding>;
    remove(id: string, req: JwtReq): Promise<void>;
}
export {};
