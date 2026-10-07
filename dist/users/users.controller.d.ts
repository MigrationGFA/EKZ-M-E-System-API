import { UsersService } from './users.service.js';
import { InviteUserDto } from './dto/invite-user.dto.js';
import { UpdateRoleDto } from './dto/update-role.dto.js';
import { AuditService } from '../audit/audit.service.js';
import { UserRole } from '../common/enums/user-role.enum.js';
export declare class UsersController {
    private readonly usersService;
    private readonly auditService;
    constructor(usersService: UsersService, auditService: AuditService);
    findAll(role?: string, search?: string, page?: string, per_page?: string): Promise<{
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
    findOne(id: string): Promise<{
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
    invite(dto: InviteUserDto): Promise<{
        message: string;
    }>;
    updateRole(id: string, dto: UpdateRoleDto, req: {
        user: {
            id: string;
        };
    }): Promise<{
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
    deactivate(id: string, req: {
        user: {
            id: string;
        };
    }): Promise<{
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
    resetPassword(id: string): Promise<{
        message: string;
    }>;
}
