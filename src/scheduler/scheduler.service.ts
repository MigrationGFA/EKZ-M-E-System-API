import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Indicator } from '../indicators/indicator.entity.js';
import { AlertsService } from '../alerts/alerts.service.js';
import { UsersService } from '../users/users.service.js';

@Injectable()
export class SchedulerService {
  private readonly logger = new Logger(SchedulerService.name);

  constructor(
    @InjectRepository(Indicator)
    private readonly indicatorRepo: Repository<Indicator>,
    private readonly alertsService: AlertsService,
    private readonly usersService: UsersService,
  ) {}

  /**
   * Runs daily at 08:00. Checks for indicators whose reporting is overdue
   * based on frequency and the last progress entry date.
   */
  @Cron(CronExpression.EVERY_DAY_AT_8AM)
  async checkDeadlines(): Promise<void> {
    this.logger.log('Running deadline check...');

    const now = new Date();
    const indicators = await this.indicatorRepo.find();
    const recipients = await this.usersService.findAdminAndMeStaff();
    if (recipients.length === 0) return;

    const overdueThresholds: Record<string, number> = {
      monthly: 30,
      quarterly: 90,
      bi_annually: 180,
      annually: 365,
    };

    const lastProgressRows: { indicator_id: string; last_date: Date }[] =
      await this.indicatorRepo.manager.query(`
        SELECT indicator_id, MAX(date) as last_date
        FROM indicator_progress
        GROUP BY indicator_id
      `);

    const lastProgressMap = new Map(
      lastProgressRows.map((r) => [r.indicator_id, new Date(r.last_date)]),
    );

    for (const indicator of indicators) {
      const threshold = overdueThresholds[indicator.frequency];
      if (!threshold) continue;

      const lastDate = lastProgressMap.get(indicator.id);
      const daysSince = lastDate
        ? Math.floor((now.getTime() - lastDate.getTime()) / 86400000)
        : Infinity;

      if (daysSince >= threshold) {
        for (const recipient of recipients) {
          void this.alertsService.create({
            user_id: recipient.id,
            user_email: recipient.email,
            title: `Reporting Overdue: ${indicator.code}`,
            description: `Indicator "${indicator.name}" (${indicator.frequency}) has not been updated in ${daysSince === Infinity ? 'a long time' : `${daysSince} days`}. A progress entry is overdue.`,
            type: 'deadline',
          });
        }
      }
    }

    this.logger.log('Deadline check complete.');
  }
}
