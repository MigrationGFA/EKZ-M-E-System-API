import { Repository } from 'typeorm';
import { SafeguardMeasure } from './safeguard-measure.entity.js';
import { UpsertSafeguardDto } from './dto/upsert-safeguard.dto.js';
import { AuditService } from '../../audit/audit.service.js';
export declare class SafeguardsService {
    private readonly repo;
    private readonly auditService;
    constructor(repo: Repository<SafeguardMeasure>, auditService: AuditService);
    findAll(): Promise<SafeguardMeasure[]>;
    create(dto: UpsertSafeguardDto, actorId: string, actorName: string): Promise<SafeguardMeasure>;
    update(id: string, dto: UpsertSafeguardDto, actorId: string, actorName: string): Promise<SafeguardMeasure>;
    remove(id: string, actorId: string, actorName: string): Promise<void>;
    private snapshot;
}
