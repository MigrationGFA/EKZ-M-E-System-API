import { Repository } from 'typeorm';
import { ActivityQuarterlyStatus } from './activity-quarterly-status.entity.js';
import { LogframeNode } from '../logframe/logframe-node.entity.js';
import { UpsertAwpStatusDto } from './dto/upsert-awp-status.dto.js';
import { AuditService } from '../audit/audit.service.js';
export declare class AwpStatusService {
    private readonly repo;
    private readonly nodeRepo;
    private readonly auditService;
    constructor(repo: Repository<ActivityQuarterlyStatus>, nodeRepo: Repository<LogframeNode>, auditService: AuditService);
    findByPeriod(year: number, quarter: number): Promise<ActivityQuarterlyStatus[]>;
    upsert(nodeId: string, year: number, quarter: number, dto: UpsertAwpStatusDto, actorId: string, actorName: string): Promise<ActivityQuarterlyStatus>;
    private snapshot;
}
