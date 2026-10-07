import { Repository } from 'typeorm';
import { ProjectRisk } from './project-risk.entity.js';
import { UpsertRiskDto } from './dto/upsert-risk.dto.js';
import { AuditService } from '../audit/audit.service.js';
export declare class ProjectRisksService {
    private readonly repo;
    private readonly auditService;
    constructor(repo: Repository<ProjectRisk>, auditService: AuditService);
    findAll(filters?: {
        include_resolved?: boolean;
    }): Promise<ProjectRisk[]>;
    create(dto: UpsertRiskDto, actorId: string, actorName: string): Promise<ProjectRisk>;
    update(id: string, dto: UpsertRiskDto, actorId: string, actorName: string): Promise<ProjectRisk>;
    resolve(id: string, actorId: string, actorName: string): Promise<ProjectRisk>;
    private snapshot;
}
