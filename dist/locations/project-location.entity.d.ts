import { User } from '../users/user.entity.js';
export declare class ProjectLocation {
    id: string;
    name: string;
    sector: string;
    description: string | null;
    lat: number;
    lng: number;
    radius_m: number;
    indicator_ids: string[];
    created_by: string;
    creator: User;
    created_at: Date;
    updated_at: Date;
}
