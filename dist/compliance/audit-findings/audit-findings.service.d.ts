import { Repository } from 'typeorm';
import { AuditFinding } from './audit-finding.entity.js';
import { UpsertAuditFindingDto } from './dto/upsert-audit-finding.dto.js';
import { AuditService } from '../../audit/audit.service.js';
export declare class AuditFindingsService {
    private readonly repo;
    private readonly auditService;
    constructor(repo: Repository<AuditFinding>, auditService: AuditService);
    findAll(): Promise<AuditFinding[]>;
    create(dto: UpsertAuditFindingDto, actorId: string, actorName: string): Promise<AuditFinding>;
    update(id: string, dto: UpsertAuditFindingDto, actorId: string, actorName: string): Promise<AuditFinding>;
    remove(id: string, actorId: string, actorName: string): Promise<void>;
    private snapshot;
}
