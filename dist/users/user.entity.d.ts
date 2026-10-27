export declare enum UserRole {
    ADMIN = "admin",
    ME_STAFF = "me_staff",
    PROGRAMME_STAFF = "programme_staff",
    VIEWER = "viewer",
    API_TOKEN = "api_token"
}
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
