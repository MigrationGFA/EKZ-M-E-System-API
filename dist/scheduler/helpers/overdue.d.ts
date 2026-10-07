export type OverdueReason = 'calendar' | 'mid_term_window' | 'one_off_post_completion';
export interface IsOverdueResult {
    overdue: boolean;
    reason: OverdueReason | null;
    daysSince: number | null;
}
export interface OverdueIndicator {
    frequency: string;
}
export interface OverdueProjectMeta {
    midpoint_date: Date | null;
    completion_year: number;
}
export declare function isOverdue(indicator: OverdueIndicator, lastProgressDate: Date | null, projectMeta: OverdueProjectMeta | null, now: Date): IsOverdueResult;
