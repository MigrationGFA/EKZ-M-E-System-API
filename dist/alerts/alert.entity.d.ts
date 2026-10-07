import { User } from '../users/user.entity.js';
export declare class Alert {
    id: string;
    user_id: string;
    user: User;
    title: string;
    description: string;
    type: string;
    is_read: boolean;
    created_at: Date;
}
