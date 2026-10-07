import { Repository } from 'typeorm';
import { QuarterlyProgressReport } from './quarterly-progress-report.entity.js';
import { UpsertQuarterlyReportDto } from './dto/upsert-quarterly-report.dto.js';
import { AuditService } from '../audit/audit.service.js';
export declare class QuarterlyReportsService {
    private readonly repo;
    private readonly auditService;
    constructor(repo: Repository<QuarterlyProgressReport>, auditService: AuditService);
    findOne(year: number, quarter: number): Promise<QuarterlyProgressReport | null>;
    getOrCreate(year: number, quarter: number, actorId: string, actorName: string): Promise<QuarterlyProgressReport>;
    upsert(year: number, quarter: number, dto: UpsertQuarterlyReportDto, actorId: string, actorName: string): Promise<QuarterlyProgressReport>;
    markGenerated(year: number, quarter: number, generatedBy: string): Promise<QuarterlyProgressReport>;
    private applyDto;
    private assertValidQuarter;
    private snapshot;
}
