import { Repository } from 'typeorm';
import { ProjectCovenant } from './project-covenant.entity.js';
import { UpsertCovenantDto } from './dto/upsert-covenant.dto.js';
import { AuditService } from '../../audit/audit.service.js';
export declare class CovenantsService {
    private readonly repo;
    private readonly auditService;
    constructor(repo: Repository<ProjectCovenant>, auditService: AuditService);
    findAll(): Promise<ProjectCovenant[]>;
    create(dto: UpsertCovenantDto, actorId: string, actorName: string): Promise<ProjectCovenant>;
    update(id: string, dto: UpsertCovenantDto, actorId: string, actorName: string): Promise<ProjectCovenant>;
    remove(id: string, actorId: string, actorName: string): Promise<void>;
    private snapshot;
}
