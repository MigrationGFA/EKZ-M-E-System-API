import { Repository } from 'typeorm';
import { Alert } from './alert.entity.js';
import { MailService } from '../mail/mail.service.js';
export declare class AlertsService {
    private readonly alertRepo;
    private readonly mailService;
    constructor(alertRepo: Repository<Alert>, mailService: MailService);
    findAll(filters: {
        unread_only?: boolean;
        type?: string;
        page?: number;
        per_page?: number;
        user_id?: string;
    }): Promise<{
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
    create(dto: {
        user_id: string;
        user_email: string;
        title: string;
        description: string;
        type: string;
        sendEmail?: boolean;
    }): Promise<{
        id: string;
        title: string;
        description: string;
        type: string;
        isRead: boolean;
        timestamp: Date;
    }>;
    hasRecentAlert(filters: {
        user_id: string;
        type: string;
        title_prefix: string;
        since: Date;
    }): Promise<boolean>;
    markRead(id: string): Promise<{
        success: boolean;
    }>;
    markAllRead(userId: string): Promise<{
        success: boolean;
    }>;
    private serialize;
}
