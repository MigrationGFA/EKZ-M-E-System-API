import { AlertsService } from './alerts.service.js';
export declare class AlertsController {
    private readonly alertsService;
    constructor(alertsService: AlertsService);
    findAll(req: any, unread_only?: string, type?: string, page?: string, per_page?: string): Promise<{
        data: {
            id: string;
            title: string;
            description: string;
            type: string;
            isRead: boolean;
            timestamp: Date;
        }[];
        total: number;
        page: number;
        per_page: number;
    }>;
    markAllRead(req: any): Promise<{
        success: boolean;
    }>;
    markRead(id: string): Promise<{
        success: boolean;
    }>;
}
