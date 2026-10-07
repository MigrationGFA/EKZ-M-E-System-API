import { Indicator } from './indicator.entity.js';
export declare class IndicatorProgress {
    id: string;
    indicator_id: string;
    indicator: Indicator;
    value: number;
    date: Date;
    notes: string | null;
    submitted_by: string;
    created_at: Date;
}
