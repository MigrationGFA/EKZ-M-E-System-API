import { UserRole } from '../common/enums/user-role.enum.js';
export declare class User {
    id: string;
    email: string;
    name: string;
    password_hash: string;
    role: UserRole;
    avatar: string | null;
    active: boolean;
    is_default_password: boolean;
    last_login: Date | null;
    password_reset_token: string | null;
    password_reset_expires: Date | null;
    created_at: Date;
    updated_at: Date;
}
