import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Indicator } from '../indicators/indicator.entity.js';
import { IndicatorYearTarget } from '../indicators/indicator-year-target.entity.js';
import { AlertsService } from '../alerts/alerts.service.js';
import { UsersService } from '../users/users.service.js';
import { ProjectMetaService } from '../project-meta/project-meta.service.js';
import { expectedAt } from '../indicators/helpers/expected-progress.js';
import {
  isOverdue,
  IsOverdueResult,
  OverdueProjectMeta,
} from './helpers/overdue.js';

// Re-emit suppression windows. Calendar overdue gets a windows-equal-to-
// the-frequency-period dedup so we don't spam daily for the same gap;
// mid_term / one_off fire effectively once because the condition is
// stable (a tiny in-window write would clear it). At-risk math gets a
// 7-day dedup so a chronic off-track indicator surfaces weekly.
const CALENDAR_DEDUP_DAYS: Record<string, number> = {
  monthly: 15,
  quarterly: 30,
  bi_annually: 60,
  annually: 90,
};
const MID_TERM_DEDUP_DAYS = 10_000; // ~27 years — effectively forever
const ONE_OFF_DEDUP_DAYS = 10_000;
const AT_RISK_DEDUP_DAYS = 7;
const AT_RISK_RATIO_THRESHOLD = 0.6;
const MS_PER_DAY = 86_400_000;

@Injectable()
export class SchedulerService {
  private readonly logger = new Logger(SchedulerService.name);

  constructor(
    @InjectRepository(Indicator)
    private readonly indicatorRepo: Repository<Indicator>,
    @InjectRepository(IndicatorYearTarget)
    private readonly yearTargetsRepo: Repository<IndicatorYearTarget>,
    private readonly alertsService: AlertsService,
    private readonly usersService: UsersService,
    private readonly projectMetaService: ProjectMetaService,
  ) {}

  /**
   * Runs daily at 08:00. Checks every indicator for two independent
   * conditions:
   *
   *   1. Reporting overdue (calendar / mid_term / one_off rules — see
   *      helpers/overdue.ts). Alert type 'deadline'.
   *   2. Mathematically off-track (current_value / expectedAt(now) < 0.6,
   *      using Phase 3's year-aware helper). Alert type 'missed_target'.
   *
   * Both run per indicator + per recipient; each path has its own dedup
   * window (see constants above) so a chronic condition surfaces at a
   * sensible cadence rather than every morning.
   */
  @Cron(CronExpression.EVERY_DAY_AT_8AM)
  async checkDeadlines(): Promise<void> {
    this.logger.log('Running scheduler tick…');
    const now = new Date();

    const [indicators, recipients] = await Promise.all([
      this.indicatorRepo.find(),
      this.usersService.findAdminAndMeStaff(),
    ]);
    if (recipients.length === 0) {
      this.logger.log('Scheduler tick: no admin/me_staff recipients.');
      return;
    }
    if (indicators.length === 0) {
      this.logger.log('Scheduler tick: no indicators to check.');
      return;
    }

    const lastProgressMap = await this.loadLastProgress();
    const projectMeta = await this.loadProjectMeta();
    const yearTargetsByIndicator = await this.loadYearTargets(
      indicators.map((i) => i.id),
    );
    const baselineDate = projectMeta
      ? new Date(Date.UTC(projectMeta.baseline_year, 0, 1))
      : undefined;

    let overdueCount = 0;
    let atRiskCount = 0;

    for (const indicator of indicators) {
      const lastDate =
        lastProgressMap.get(indicator.id) ??
        (indicator.created_at ? new Date(indicator.created_at) : null);

      const overdueResult = isOverdue(
        { frequency: indicator.frequency },
        lastDate,
        projectMeta ? this.toOverdueMeta(projectMeta) : null,
        now,
      );

      if (overdueResult.overdue) {
        overdueCount += await this.emitOverdueAlerts(
          indicator,
          overdueResult,
          recipients,
          now,
        );
      }

      const expected = expectedAt(
        {
          target_mode: indicator.target_mode,
          target: Number(indicator.target),
          baseline: Number(indicator.baseline),
        },
        yearTargetsByIndicator.get(indicator.id)?.map((t) => ({
          year: t.year,
          target_value: Number(t.target_value),
        })) ?? [],
        now,
        { baselineDate },
      );

      if (expected > 0) {
        const ratio = Number(indicator.current_value) / expected;
        if (ratio < AT_RISK_RATIO_THRESHOLD) {
          atRiskCount += await this.emitAtRiskAlerts(
            indicator,
            expected,
            ratio,
            recipients,
            now,
          );
        }
      }
    }

    this.logger.log(
      `Scheduler tick complete — emitted ${overdueCount} overdue + ${atRiskCount} at-risk alerts.`,
    );
  }

  // ─── Loaders ────────────────────────────────────────────────────────────

  private async loadLastProgress(): Promise<Map<string, Date>> {
    const rows: { indicator_id: string; last_date: Date }[] = await this
      .indicatorRepo.manager.query(`
        SELECT indicator_id, MAX(date) as last_date
        FROM indicator_progress
        GROUP BY indicator_id
      `);
    return new Map(rows.map((r) => [r.indicator_id, new Date(r.last_date)]));
  }

  private async loadProjectMeta(): Promise<{
    midpoint_date: Date | null;
    completion_year: number;
    baseline_year: number;
  } | null> {
    try {
      const meta = await this.projectMetaService.get();
      return {
        midpoint_date: meta.midpoint_date ? new Date(meta.midpoint_date) : null,
        completion_year: meta.completion_year,
        baseline_year: meta.baseline_year,
      };
    } catch (e) {
      if (e instanceof NotFoundException) return null;
      throw e;
    }
  }

  private async loadYearTargets(
    indicatorIds: string[],
  ): Promise<Map<string, IndicatorYearTarget[]>> {
    if (indicatorIds.length === 0) return new Map();
    const rows = await this.yearTargetsRepo.find({
      where: { indicator_id: In(indicatorIds) },
      order: { year: 'ASC' },
    });
    const map = new Map<string, IndicatorYearTarget[]>();
    for (const r of rows) {
      const list = map.get(r.indicator_id) ?? [];
      list.push(r);
      map.set(r.indicator_id, list);
    }
    return map;
  }

  private toOverdueMeta(meta: {
    midpoint_date: Date | null;
    completion_year: number;
  }): OverdueProjectMeta {
    return {
      midpoint_date: meta.midpoint_date,
      completion_year: meta.completion_year,
    };
  }

  // ─── Emitters ──────────────────────────────────────────────────────────

  private async emitOverdueAlerts(
    indicator: Indicator,
    result: IsOverdueResult,
    recipients: { id: string; email: string }[],
    now: Date,
  ): Promise<number> {
    const titlePrefix = this.overdueTitlePrefix(indicator, result);
    const description = this.overdueDescription(indicator, result);
    const dedupDays = this.overdueDedupDays(indicator.frequency);
    const since = new Date(now.getTime() - dedupDays * MS_PER_DAY);

    let emitted = 0;
    for (const recipient of recipients) {
      const recent = await this.alertsService.hasRecentAlert({
        user_id: recipient.id,
        type: 'deadline',
        title_prefix: titlePrefix,
        since,
      });
      if (recent) continue;
      void this.alertsService.create({
        user_id: recipient.id,
        user_email: recipient.email,
        title: titlePrefix,
        description,
        type: 'deadline',
        sendEmail: false,
      });
      emitted += 1;
    }
    return emitted;
  }

  private async emitAtRiskAlerts(
    indicator: Indicator,
    expected: number,
    ratio: number,
    recipients: { id: string; email: string }[],
    now: Date,
  ): Promise<number> {
    const titlePrefix = `Off Track: ${indicator.code}`;
    const description =
      `Indicator "${indicator.name}" is at ${(ratio * 100).toFixed(1)}% of the expected ${expected.toFixed(2)} ${indicator.unit} at ${now.toISOString().slice(0, 10)} ` +
      `(current ${Number(indicator.current_value).toFixed(2)}). Review and take corrective action.`;
    const since = new Date(now.getTime() - AT_RISK_DEDUP_DAYS * MS_PER_DAY);

    let emitted = 0;
    for (const recipient of recipients) {
      const recent = await this.alertsService.hasRecentAlert({
        user_id: recipient.id,
        type: 'missed_target',
        title_prefix: titlePrefix,
        since,
      });
      if (recent) continue;
      void this.alertsService.create({
        user_id: recipient.id,
        user_email: recipient.email,
        title: titlePrefix,
        description,
        type: 'missed_target',
        sendEmail: false,
      });
      emitted += 1;
    }
    return emitted;
  }

  // ─── Copy helpers ──────────────────────────────────────────────────────

  private overdueTitlePrefix(
    indicator: Indicator,
    result: IsOverdueResult,
  ): string {
    switch (result.reason) {
      case 'mid_term_window':
        return `Mid-term Reporting Missed: ${indicator.code}`;
      case 'one_off_post_completion':
        return `One-off Indicator Has No Data: ${indicator.code}`;
      case 'calendar':
      default:
        return `Reporting Overdue: ${indicator.code}`;
    }
  }

  private overdueDescription(
    indicator: Indicator,
    result: IsOverdueResult,
  ): string {
    const base = `Indicator "${indicator.name}" (${indicator.frequency})`;
    switch (result.reason) {
      case 'mid_term_window':
        return result.daysSince === null
          ? `${base} has no progress entries; the mid-term reporting window has passed.`
          : `${base}'s last progress entry is ${result.daysSince} days old and falls outside the ±90-day mid-term reporting window.`;
      case 'one_off_post_completion':
        return `${base} has no progress entries and the project completion year has passed. A one-off reading is overdue.`;
      case 'calendar':
      default:
        return result.daysSince === null
          ? `${base} has no progress entries on file. A progress reading is overdue.`
          : `${base} has not been updated in ${result.daysSince} days. A progress entry is overdue.`;
    }
  }

  private overdueDedupDays(frequency: string): number {
    if (frequency === 'mid_term') return MID_TERM_DEDUP_DAYS;
    if (frequency === 'one_off') return ONE_OFF_DEDUP_DAYS;
    return CALENDAR_DEDUP_DAYS[frequency] ?? 7;
  }
}
