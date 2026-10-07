import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service.js';
import { AuditService } from '../audit/audit.service.js';
import { MailService } from '../mail/mail.service.js';
import { Repository } from 'typeorm';
import { User } from '../users/user.entity.js';
export declare class AuthService {
    private readonly usersService;
    private readonly jwtService;
    private readonly auditService;
    private readonly mailService;
    private readonly usersRepo;
    constructor(usersService: UsersService, jwtService: JwtService, auditService: AuditService, mailService: MailService, usersRepo: Repository<User>);
    login(email: string, password: string): Promise<{
        user: {
            id: string;
            email: string;
            name: string;
            role: import("../common/enums/user-role.enum.js").UserRole;
            avatar: string | null;
            is_default_password: boolean;
        };
        token: string;
    }>;
    changePassword(userId: string, currentPassword: string, newPassword: string): Promise<{
        message: string;
    }>;
    forgotPassword(email: string): Promise<void>;
    resetPasswordWithToken(token: string, newPassword: string): Promise<void>;
}
