import { Repository } from 'typeorm';
import { ApiToken } from './api-token.entity.js';
import { UsersService } from '../users/users.service.js';
import { MailService } from '../mail/mail.service.js';
import { AuditService } from '../audit/audit.service.js';
export declare class ApiTokensService {
    private readonly tokenRepo;
    private readonly usersService;
    private readonly mailService;
    private readonly auditService;
    constructor(tokenRepo: Repository<ApiToken>, usersService: UsersService, mailService: MailService, auditService: AuditService);
    findAll(): Promise<{
        id: string;
        name: string;
        tokenPart: string;
        createdAt: Date;
    }[]>;
    create(name: string, actorId: string, actorName: string): Promise<{
        id: string;
        name: string;
        tokenPart: string;
        createdAt: Date;
        rawToken: string;
    }>;
    remove(id: string, actorId: string, actorName: string): Promise<{
        success: boolean;
    }>;
    private notifyAdmins;
}
