import { Repository } from 'typeorm';
import { ProjectFinancingSource } from './project-financing-source.entity.js';
import { ProjectMeta } from '../project-meta/project-meta.entity.js';
import { UpsertFinancingSourceDto } from './dto/upsert-financing-source.dto.js';
import { AuditService } from '../audit/audit.service.js';
export declare class ProjectFinancingSourcesService {
    private readonly repo;
    private readonly metaRepo;
    private readonly auditService;
    constructor(repo: Repository<ProjectFinancingSource>, metaRepo: Repository<ProjectMeta>, auditService: AuditService);
    findAll(): Promise<ProjectFinancingSource[]>;
    create(dto: UpsertFinancingSourceDto, actorId: string, actorName: string): Promise<ProjectFinancingSource>;
    update(id: string, dto: UpsertFinancingSourceDto, actorId: string, actorName: string): Promise<ProjectFinancingSource>;
    remove(id: string, actorId: string, actorName: string): Promise<void>;
    private snapshot;
}
