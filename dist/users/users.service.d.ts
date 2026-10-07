import { Repository } from 'typeorm';
import { User } from './user.entity.js';
import { UserRole } from '../common/enums/user-role.enum.js';
import { MailService } from '../mail/mail.service.js';
export declare class UsersService {
    private readonly usersRepo;
    private readonly mailService;
    constructor(usersRepo: Repository<User>, mailService: MailService);
    findByEmail(email: string): Promise<User | null>;
    findById(id: string): Promise<User | null>;
    findAdminAndMeStaff(): Promise<Pick<User, 'id' | 'email' | 'name' | 'role'>[]>;
    updateLastLogin(id: string): Promise<void>;
    findAll(filters: {
        role?: string;
        search?: string;
        page?: number;
        per_page?: number;
    }): Promise<{
        data: {
            id: string;
            email: string;
            name: string;
            role: UserRole;
            avatar: string | null;
            active: boolean;
            is_default_password: boolean;
            lastLogin: Date | null;
            createdAt: Date;
            submission_count: number;
        }[];
        total: number;
        page: number;
        per_page: number;
    }>;
    invite(name: string, email: string, role: string): Promise<{
        message: string;
    }>;
    resetPassword(id: string): Promise<{
        message: string;
        userName: string;
    }>;
    reactivate(id: string): Promise<{
        id: string;
        email: string;
        name: string;
        role: UserRole;
        avatar: string | null;
        active: boolean;
        is_default_password: boolean;
        lastLogin: Date | null;
        createdAt: Date;
    }>;
    updateRole(id: string, role: string, requestingUserId: string): Promise<{
        user: {
            id: string;
            email: string;
            name: string;
            role: UserRole;
            avatar: string | null;
            active: boolean;
            is_default_password: boolean;
            lastLogin: Date | null;
            createdAt: Date;
        };
        oldRole: UserRole;
    }>;
    deactivate(id: string, requestingUserId: string): Promise<{
        id: string;
        email: string;
        name: string;
        role: UserRole;
        avatar: string | null;
        active: boolean;
        is_default_password: boolean;
        lastLogin: Date | null;
        createdAt: Date;
    }>;
    serializeUser(u: User): {
        id: string;
        email: string;
        name: string;
        role: UserRole;
        avatar: string | null;
        active: boolean;
        is_default_password: boolean;
        lastLogin: Date | null;
        createdAt: Date;
    };
}
