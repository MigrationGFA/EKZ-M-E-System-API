import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Indicator } from '../indicators/indicator.entity.js';
import { IndicatorProgress } from '../indicators/indicator-progress.entity.js';
import { IndicatorYearTarget } from '../indicators/indicator-year-target.entity.js';
import { Submission } from '../submissions/submission.entity.js';
import { Alert } from '../alerts/alert.entity.js';
import { SDG_NAMES } from '../common/constants/sdg-names.js';
import { ProjectMetaService } from '../project-meta/project-meta.service.js';
import { expectedAt } from '../indicators/helpers/expected-progress.js';

const MONTH_NAMES = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(Indicator)
    private readonly indicatorRepo: Repository<Indicator>,
    @InjectRepository(IndicatorProgress)
    private readonly progressRepo: Repository<IndicatorProgress>,
    @InjectRepository(IndicatorYearTarget)
    private readonly yearTargetsRepo: Repository<IndicatorYearTarget>,
    @InjectRepository(Submission)
    private readonly subRepo: Repository<Submission>,
    @InjectRepository(Alert)
    private readonly alertRepo: Repository<Alert>,
    private readonly projectMetaService: ProjectMetaService,
  ) {}

  async getExecutive(userId: string, from?: string, to?: string) {
    const indicators = await this.indicatorRepo.find();

    // KPIs
    let onTrack = 0;
    let atRisk = 0;
    let offTrack = 0;
    for (const ind of indicators) {
      if (ind.status === 'on_track') onTrack++;
      else if (ind.status === 'at_risk') atRisk++;
      else offTrack++;
    }

    // Submissions this month — apply from/to filters
    const now = new Date();
    const subQb = this.subRepo.createQueryBuilder('s');
    if (from) {
      subQb.andWhere('s.submitted_at >= :from', { from });
    } else {
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      subQb.andWhere('s.submitted_at >= :start', {
        start: monthStart.toISOString(),
      });
    }
    if (to) {
      subQb.andWhere('s.submitted_at <= :to', { to });
    }
    const submissionsThisMonth = await subQb.getCount();

    const pendingSync = await this.subRepo.count({
      where: { validation_status: 'pending' },
    });

    const kpis = {
      total_indicators: indicators.length,
      on_track: onTrack,
      at_risk: atRisk,
      off_track: offTrack,
      submissions_this_month: submissionsThisMonth,
      pending_sync: pendingSync,
    };

    // Monthly trend — real data from indicator_progress, 6 months
    const monthly_trend = await this.buildMonthlyTrend(indicators, from, to);

    // Status distribution — always all three
    const status_distribution = [
      { status: 'on_track', count: onTrack },
      { status: 'at_risk', count: atRisk },
      { status: 'off_track', count: offTrack },
    ];

    // SDG progress
    const sdgMap = new Map<number, { total: number; count: number }>();
    for (const ind of indicators) {
      for (const sdgId of ind.sdg_ids) {
        if (!sdgMap.has(sdgId)) {
          sdgMap.set(sdgId, { total: 0, count: 0 });
        }
        const entry = sdgMap.get(sdgId)!;
        const target = Number(ind.target);
        const progress =
          target > 0 ? (Number(ind.current_value) / target) * 100 : 0;
        entry.total += progress;
        entry.count++;
      }
    }

    const sdg_progress = Array.from(sdgMap.entries()).map(
      ([sdgId, { total, count }]) => ({
        sdg_id: sdgId,
        name: SDG_NAMES[sdgId] ?? `SDG ${sdgId}`,
        progress: Math.round(total / count),
      }),
    );

    // Recent submissions — last 5, filtered by date range if provided
    const recentSubQb = this.subRepo
      .createQueryBuilder('s')
      .orderBy('s.submitted_at', 'DESC')
      .take(5);
    if (from) {
      recentSubQb.andWhere('s.submitted_at >= :from', { from });
    }
    if (to) {
      recentSubQb.andWhere('s.submitted_at <= :to', { to });
    }
    const recentSubs = await recentSubQb.getMany();
    const recent_submissions = recentSubs.map((s) => ({
      id: s.id,
      formId: s.form_id,
      officerId: s.officer_id,
      data: s.data,
      location: s.location,
      location_id: s.location_id,
      on_site: s.on_site,
      submittedAt: s.submitted_at,
      validation_status: s.validation_status,
      validation_comment: s.validation_comment,
    }));

    // Recent alerts — last 3 unread for requesting user
    const recentAlerts = await this.alertRepo.find({
      where: { user_id: userId, is_read: false },
      order: { created_at: 'DESC' },
      take: 3,
    });
    const recent_alerts = recentAlerts.map((a) => ({
      id: a.id,
      title: a.title,
      description: a.description,
      type: a.type,
      isRead: a.is_read,
      timestamp: a.created_at,
    }));

    return {
      kpis,
      monthly_trend,
      status_distribution,
      sdg_progress,
      recent_submissions,
      recent_alerts,
    };
  }

  private async buildMonthlyTrend(
    indicators: Indicator[],
    from?: string,
    to?: string,
  ): Promise<
    { month: string; actual: number; target: number; expected: number }[]
  > {
    const now = new Date();
    const totalTarget = indicators.reduce((s, i) => s + Number(i.target), 0);

    // Build the 6-month window
    const months: { start: Date; end: Date; label: string }[] = [];
    for (let i = 5; i >= 0; i--) {
      const start = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const end = new Date(
        start.getFullYear(),
        start.getMonth() + 1,
        0,
        23,
        59,
        59,
        999,
      );
      months.push({ start, end, label: MONTH_NAMES[start.getMonth()] });
    }

    // Year-target trajectory: sum of expectedAt(...) across indicators per
    // month-end. Same unit-agnostic summation pattern as `target` above —
    // mixed units already aggregate today, this just makes the aggregate
    // year-aware.
    const yearTargetRows = await this.yearTargetsRepo.find();
    const yearTargetsByInd = new Map<string, IndicatorYearTarget[]>();
    for (const yt of yearTargetRows) {
      if (!yearTargetsByInd.has(yt.indicator_id))
        yearTargetsByInd.set(yt.indicator_id, []);
      yearTargetsByInd.get(yt.indicator_id)!.push(yt);
    }
    let baselineDate: Date | undefined;
    try {
      const meta = await this.projectMetaService.get();
      baselineDate = new Date(Date.UTC(meta.baseline_year, 0, 1));
    } catch (e) {
      if (!(e instanceof NotFoundException)) throw e;
    }
    const expectedByMonth = months.map((m) => {
      let totalExpected = 0;
      for (const ind of indicators) {
        const yts = yearTargetsByInd.get(ind.id) ?? [];
        totalExpected += expectedAt(
          {
            target_mode: ind.target_mode,
            target: Number(ind.target),
            baseline: Number(ind.baseline),
          },
          yts.map((y) => ({
            year: y.year,
            target_value: Number(y.target_value),
          })),
          m.end,
          { baselineDate },
        );
      }
      return totalExpected;
    });

    // Query actual progress data grouped by month
    const rangeStart = months[0].start;
    const rangeEnd = months[months.length - 1].end;

    const progressQb = this.progressRepo
      .createQueryBuilder('p')
      .select("DATE_TRUNC('month', p.date)", 'month')
      .addSelect('SUM(p.value)', 'actual')
      .where('p.date >= :rangeStart', {
        rangeStart: rangeStart.toISOString(),
      })
      .andWhere('p.date <= :rangeEnd', {
        rangeEnd: rangeEnd.toISOString(),
      })
      .groupBy("DATE_TRUNC('month', p.date)")
      .orderBy('month', 'ASC');

    // Apply from/to filters if provided
    if (from) {
      progressQb.andWhere('p.date >= :from', { from });
    }
    if (to) {
      progressQb.andWhere('p.date <= :to', { to });
    }

    const rawRows: { month: string; actual: string }[] =
      await progressQb.getRawMany();

    // Build a lookup: month key (YYYY-MM) → actual sum
    const actualByMonth = new Map<string, number>();
    for (const row of rawRows) {
      const d = new Date(row.month);
      const key = `${d.getFullYear()}-${String(d.getMonth()).padStart(2, '0')}`;
      actualByMonth.set(key, Number(row.actual));
    }

    // If no progress data at all, fall back to current totals (original behavior)
    if (actualByMonth.size === 0) {
      const totalActual = indicators.reduce(
        (s, i) => s + Number(i.current_value),
        0,
      );
      return months.map((m, i) => ({
        month: m.label,
        actual: totalActual,
        target: totalTarget,
        expected: expectedByMonth[i],
      }));
    }

    return months.map((m, i) => {
      const key = `${m.start.getFullYear()}-${String(m.start.getMonth()).padStart(2, '0')}`;
      return {
        month: m.label,
        actual: actualByMonth.get(key) ?? 0,
        target: totalTarget,
        expected: expectedByMonth[i],
      };
    });
  }
}
