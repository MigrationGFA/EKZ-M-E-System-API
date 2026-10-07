import { Repository } from 'typeorm';
import { ProjectMeta } from './project-meta.entity.js';
import { LogframeNode } from '../logframe/logframe-node.entity.js';
import { UpsertProjectMetaDto } from './dto/upsert-project-meta.dto.js';
import { AuditService } from '../audit/audit.service.js';
export declare class ProjectMetaService {
    private readonly metaRepo;
    private readonly nodeRepo;
    private readonly auditService;
    constructor(metaRepo: Repository<ProjectMeta>, nodeRepo: Repository<LogframeNode>, auditService: AuditService);
    get(): Promise<ProjectMeta>;
    upsert(dto: UpsertProjectMetaDto, actorId: string, actorName: string): Promise<ProjectMeta>;
    private dtoToPersist;
    private snapshot;
}
