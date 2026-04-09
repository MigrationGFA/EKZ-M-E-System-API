import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Indicator } from '../indicators/indicator.entity.js';
import { Submission } from '../submissions/submission.entity.js';
import { Alert } from '../alerts/alert.entity.js';
import { SDG_NAMES } from '../common/constants/sdg-names.js';

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
    @InjectRepository(Submission)
    private readonly subRepo: Repository<Submission>,
    @InjectRepository(Alert)
    private readonly alertRepo: Repository<Alert>,
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

    // Submissions this month
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const submissionsThisMonth = await this.subRepo
      .createQueryBuilder('s')
      .where('s.submitted_at >= :start', { start: monthStart.toISOString() })
      .getCount();

    const kpis = {
      total_indicators: indicators.length,
      on_track: onTrack,
      at_risk: atRisk,
      off_track: offTrack,
      submissions_this_month: submissionsThisMonth,
      pending_sync: 0,
    };

    // Monthly trend — 6 most recent calendar months, oldest first
    const totalActual = indicators.reduce(
      (s, i) => s + Number(i.current_value),
      0,
    );
    const totalTarget = indicators.reduce((s, i) => s + Number(i.target), 0);

    const monthly_trend: { month: string; actual: number; target: number }[] =
      [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      monthly_trend.push({
        month: MONTH_NAMES[d.getMonth()],
        actual: totalActual,
        target: totalTarget,
      });
    }

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

    // Recent submissions — last 5
    const recentSubs = await this.subRepo.find({
      order: { submitted_at: 'DESC' },
      take: 5,
    });
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
}
