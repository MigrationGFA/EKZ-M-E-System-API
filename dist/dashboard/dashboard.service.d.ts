import { Repository } from 'typeorm';
import { Indicator } from '../indicators/indicator.entity.js';
import { IndicatorProgress } from '../indicators/indicator-progress.entity.js';
import { IndicatorYearTarget } from '../indicators/indicator-year-target.entity.js';
import { Submission } from '../submissions/submission.entity.js';
import { Alert } from '../alerts/alert.entity.js';
import { LogframeNode } from '../logframe/logframe-node.entity.js';
import { ProjectMetaService } from '../project-meta/project-meta.service.js';
export interface DashboardComponentCard {
    id: string;
    code: string;
    title: string;
    budget_usd: number | null;
    budget_currency: string;
    indicator_count: number;
    on_track: number;
    at_risk: number;
    off_track: number;
    progress_pct: number;
}
export declare class DashboardService {
    private readonly indicatorRepo;
    private readonly progressRepo;
    private readonly yearTargetsRepo;
    private readonly subRepo;
    private readonly alertRepo;
    private readonly nodeRepo;
    private readonly projectMetaService;
    constructor(indicatorRepo: Repository<Indicator>, progressRepo: Repository<IndicatorProgress>, yearTargetsRepo: Repository<IndicatorYearTarget>, subRepo: Repository<Submission>, alertRepo: Repository<Alert>, nodeRepo: Repository<LogframeNode>, projectMetaService: ProjectMetaService);
    getExecutive(userId: string, from?: string, to?: string): Promise<{
        kpis: {
            total_indicators: number;
            on_track: number;
            at_risk: number;
            off_track: number;
            submissions_this_month: number;
            pending_sync: number;
        };
        monthly_trend: {
            month: string;
            actual: number;
            target: number;
            expected: number;
        }[];
        status_distribution: {
            status: string;
            count: number;
        }[];
        sdg_progress: {
            sdg_id: number;
            name: string;
            progress: number;
        }[];
        recent_submissions: {
            id: string;
            formId: string;
            officerId: string;
            data: Record<string, any>;
            location: {
                lat: number;
                lng: number;
            } | null;
            location_id: string | null;
            on_site: boolean | null;
            submittedAt: Date;
            validation_status: string;
            validation_comment: string | null;
        }[];
        recent_alerts: {
            id: string;
            title: string;
            description: string;
            type: string;
            isRead: boolean;
            timestamp: Date;
        }[];
        components: DashboardComponentCard[];
        alerts_open: number;
    }>;
    private buildComponentCards;
    private toComponentCard;
    private buildMonthlyTrend;
}
