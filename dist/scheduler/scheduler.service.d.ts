import { Repository } from 'typeorm';
import { Indicator } from '../indicators/indicator.entity.js';
import { IndicatorYearTarget } from '../indicators/indicator-year-target.entity.js';
import { AlertsService } from '../alerts/alerts.service.js';
import { UsersService } from '../users/users.service.js';
import { ProjectMetaService } from '../project-meta/project-meta.service.js';
export declare class SchedulerService {
    private readonly indicatorRepo;
    private readonly yearTargetsRepo;
    private readonly alertsService;
    private readonly usersService;
    private readonly projectMetaService;
    private readonly logger;
    constructor(indicatorRepo: Repository<Indicator>, yearTargetsRepo: Repository<IndicatorYearTarget>, alertsService: AlertsService, usersService: UsersService, projectMetaService: ProjectMetaService);
    checkDeadlines(): Promise<void>;
    private loadLastProgress;
    private loadProjectMeta;
    private loadYearTargets;
    private toOverdueMeta;
    private emitOverdueAlerts;
    private emitAtRiskAlerts;
    private overdueTitlePrefix;
    private overdueDescription;
    private overdueDedupDays;
}
