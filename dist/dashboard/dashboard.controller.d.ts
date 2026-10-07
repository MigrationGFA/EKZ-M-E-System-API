import { DashboardService } from './dashboard.service.js';
export declare class DashboardController {
    private readonly dashboardService;
    constructor(dashboardService: DashboardService);
    getExecutive(req: any, from?: string, to?: string): Promise<{
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
        components: import("./dashboard.service.js").DashboardComponentCard[];
        alerts_open: number;
    }>;
}
