import { Indicator } from './indicator.entity.js';
export type DisaggregationAxisValue = 'sex' | 'age_band' | 'cohort' | 'skill_level' | 'geography' | 'university_origin';
export declare class IndicatorDisaggregation {
    id: string;
    indicator_id: string;
    indicator: Indicator;
    axis: DisaggregationAxisValue;
    required: boolean;
    breakdown_target: Record<string, number> | null;
    notes: string | null;
    created_at: Date;
    updated_at: Date;
}
