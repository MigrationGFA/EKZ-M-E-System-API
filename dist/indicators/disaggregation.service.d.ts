import { DataSource, Repository } from 'typeorm';
import { Indicator } from './indicator.entity.js';
import { IndicatorDisaggregation } from './indicator-disaggregation.entity.js';
import { IndicatorProgressBreakdown } from './indicator-progress-breakdown.entity.js';
import { DisaggregationAxis, ProgressBreakdownDto, SetDisaggregationsDto } from './dto/disaggregation.dto.js';
import { AuditService } from '../audit/audit.service.js';
export interface DisaggregationRollup {
    axis: DisaggregationAxis;
    total: number;
    buckets: Record<string, number>;
    target: Record<string, number> | null;
    gap: Record<string, number> | null;
}
export declare class DisaggregationService {
    private readonly indicatorRepo;
    private readonly rulesRepo;
    private readonly breakdownsRepo;
    private readonly dataSource;
    private readonly auditService;
    private readonly logger;
    constructor(indicatorRepo: Repository<Indicator>, rulesRepo: Repository<IndicatorDisaggregation>, breakdownsRepo: Repository<IndicatorProgressBreakdown>, dataSource: DataSource, auditService: AuditService);
    getRules(indicatorId: string): Promise<IndicatorDisaggregation[]>;
    setRules(indicatorId: string, dto: SetDisaggregationsDto, actorId: string, actorName: string): Promise<IndicatorDisaggregation[]>;
    getRollup(indicatorId: string, axis: DisaggregationAxis): Promise<DisaggregationRollup>;
    private computeGap;
    persistBreakdowns(progressId: string, progressValue: number, breakdowns: ProgressBreakdownDto[]): Promise<void>;
    private assertIndicatorExists;
}
