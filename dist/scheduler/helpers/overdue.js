"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isOverdue = isOverdue;
const CALENDAR_THRESHOLDS = {
    monthly: 30,
    quarterly: 90,
    bi_annually: 180,
    annually: 365,
};
const MID_TERM_WINDOW_DAYS = 90;
const MS_PER_DAY = 86_400_000;
function diffDays(a, b) {
    return Math.floor((a.getTime() - b.getTime()) / MS_PER_DAY);
}
function isOverdue(indicator, lastProgressDate, projectMeta, now) {
    const freq = indicator.frequency;
    const threshold = CALENDAR_THRESHOLDS[freq];
    if (threshold !== undefined) {
        if (lastProgressDate === null) {
            return { overdue: true, reason: 'calendar', daysSince: null };
        }
        const days = diffDays(now, lastProgressDate);
        return days >= threshold
            ? { overdue: true, reason: 'calendar', daysSince: days }
            : { overdue: false, reason: null, daysSince: days };
    }
    if (freq === 'mid_term') {
        if (!projectMeta?.midpoint_date) {
            return { overdue: false, reason: null, daysSince: null };
        }
        const midpoint = projectMeta.midpoint_date;
        if (now.getTime() <= midpoint.getTime()) {
            return { overdue: false, reason: null, daysSince: null };
        }
        if (lastProgressDate === null) {
            return { overdue: true, reason: 'mid_term_window', daysSince: null };
        }
        const windowStart = new Date(midpoint.getTime() - MID_TERM_WINDOW_DAYS * MS_PER_DAY);
        const windowEnd = new Date(midpoint.getTime() + MID_TERM_WINDOW_DAYS * MS_PER_DAY);
        const inWindow = lastProgressDate.getTime() >= windowStart.getTime() &&
            lastProgressDate.getTime() <= windowEnd.getTime();
        return inWindow
            ? {
                overdue: false,
                reason: null,
                daysSince: diffDays(now, lastProgressDate),
            }
            : {
                overdue: true,
                reason: 'mid_term_window',
                daysSince: diffDays(now, lastProgressDate),
            };
    }
    if (freq === 'one_off') {
        if (!projectMeta) {
            return { overdue: false, reason: null, daysSince: null };
        }
        const completionEnd = new Date(Date.UTC(projectMeta.completion_year, 11, 31, 23, 59, 59));
        if (now.getTime() <= completionEnd.getTime()) {
            return { overdue: false, reason: null, daysSince: null };
        }
        if (lastProgressDate === null) {
            return {
                overdue: true,
                reason: 'one_off_post_completion',
                daysSince: null,
            };
        }
        return {
            overdue: false,
            reason: null,
            daysSince: diffDays(now, lastProgressDate),
        };
    }
    return { overdue: false, reason: null, daysSince: null };
}
//# sourceMappingURL=overdue.js.map