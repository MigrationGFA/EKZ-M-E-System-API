import { IndicatorProgress } from './indicator-progress.entity.js';
import type { DisaggregationAxisValue } from './indicator-disaggregation.entity.js';
export declare class IndicatorProgressBreakdown {
    progress_id: string;
    progress: IndicatorProgress;
    axis: DisaggregationAxisValue;
    value_breakdown: Record<string, number>;
    created_at: Date;
}
