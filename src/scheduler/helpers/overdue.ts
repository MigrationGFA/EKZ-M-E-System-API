/**
 * Phase 8: rule-aware overdue check.
 *
 * Pure function — no DB / no DI. Caller loads indicator, last progress
 * date, and project_meta, then passes them in.
 *
 * Rules by frequency:
 *   - monthly      : overdue if now - lastProgress >= 30 days
 *   - quarterly    : overdue if now - lastProgress >= 90 days
 *   - bi_annually  : overdue if now - lastProgress >= 180 days
 *   - annually     : overdue if now - lastProgress >= 365 days
 *   - mid_term     : overdue if now > projectMeta.midpoint_date AND no
 *                    progress entry recorded inside [midpoint - 90d,
 *                    midpoint + 90d]. Null midpoint or null meta → never
 *                    overdue (silent skip).
 *   - one_off      : overdue if now > completion_year-12-31 AND no
 *                    progress ever. Null meta → never overdue.
 *
 * `lastProgressDate` is null when the indicator has zero progress rows.
 * For calendar frequencies we fall back to the indicator's created_at
 * as the reference date (caller's responsibility — pass that in).
 *
 * Returns null when not overdue, or a reason discriminator so callers
 * can build a tailored alert title.
 */

export type OverdueReason =
  | 'calendar'
  | 'mid_term_window'
  | 'one_off_post_completion';

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

const CALENDAR_THRESHOLDS: Record<string, number> = {
  monthly: 30,
  quarterly: 90,
  bi_annually: 180,
  annually: 365,
};

const MID_TERM_WINDOW_DAYS = 90;
const MS_PER_DAY = 86_400_000;

function diffDays(a: Date, b: Date): number {
  return Math.floor((a.getTime() - b.getTime()) / MS_PER_DAY);
}

export function isOverdue(
  indicator: OverdueIndicator,
  lastProgressDate: Date | null,
  projectMeta: OverdueProjectMeta | null,
  now: Date,
): IsOverdueResult {
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
    const windowStart = new Date(
      midpoint.getTime() - MID_TERM_WINDOW_DAYS * MS_PER_DAY,
    );
    const windowEnd = new Date(
      midpoint.getTime() + MID_TERM_WINDOW_DAYS * MS_PER_DAY,
    );
    const inWindow =
      lastProgressDate.getTime() >= windowStart.getTime() &&
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
    // Completion deadline = Dec 31 of completion_year (UTC).
    const completionEnd = new Date(
      Date.UTC(projectMeta.completion_year, 11, 31, 23, 59, 59),
    );
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
