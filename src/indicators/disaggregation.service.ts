import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Indicator } from './indicator.entity.js';
import { IndicatorDisaggregation } from './indicator-disaggregation.entity.js';
import { IndicatorProgressBreakdown } from './indicator-progress-breakdown.entity.js';
import {
  DisaggregationAxis,
  ProgressBreakdownDto,
  SetDisaggregationsDto,
} from './dto/disaggregation.dto.js';
import { AuditService } from '../audit/audit.service.js';

/**
 * Phase 4 — service layer for disaggregation rules and rollups.
 *
 * Axes that express targets as ratios (sex / age_band / skill_level) compute
 * gaps as `target[bucket] - (buckets[bucket] / total)`. Absolute-target axes
 * (cohort / geography / university_origin) compute `target[bucket] -
 * buckets[bucket]`. Indicators without rules behave exactly as before — the
 * rollup endpoint returns an empty bucket map, never 404.
 */
const RATIO_AXES = new Set<DisaggregationAxis>([
  DisaggregationAxis.SEX,
  DisaggregationAxis.AGE_BAND,
  DisaggregationAxis.SKILL_LEVEL,
]);

export interface DisaggregationRollup {
  axis: DisaggregationAxis;
  total: number;
  buckets: Record<string, number>;
  target: Record<string, number> | null;
  gap: Record<string, number> | null;
}

@Injectable()
export class DisaggregationService {
  private readonly logger = new Logger(DisaggregationService.name);

  constructor(
    @InjectRepository(Indicator)
    private readonly indicatorRepo: Repository<Indicator>,
    @InjectRepository(IndicatorDisaggregation)
    private readonly rulesRepo: Repository<IndicatorDisaggregation>,
    @InjectRepository(IndicatorProgressBreakdown)
    private readonly breakdownsRepo: Repository<IndicatorProgressBreakdown>,
    private readonly dataSource: DataSource,
    private readonly auditService: AuditService,
  ) {}

  async getRules(indicatorId: string): Promise<IndicatorDisaggregation[]> {
    await this.assertIndicatorExists(indicatorId);
    return this.rulesRepo.find({
      where: { indicator_id: indicatorId },
      order: { axis: 'ASC' },
    });
  }

  async setRules(
    indicatorId: string,
    dto: SetDisaggregationsDto,
    actorId: string,
    actorName: string,
  ): Promise<IndicatorDisaggregation[]> {
    await this.assertIndicatorExists(indicatorId);

    const seenAxes = new Set<string>();
    for (const rule of dto.rules) {
      if (seenAxes.has(rule.axis)) {
        throw new BadRequestException(
          `Duplicate axis '${rule.axis}' in disaggregation rules`,
        );
      }
      seenAxes.add(rule.axis);
    }

    const before = await this.rulesRepo.find({
      where: { indicator_id: indicatorId },
      order: { axis: 'ASC' },
    });

    const saved = await this.dataSource.transaction(async (manager) => {
      const repo = manager.getRepository(IndicatorDisaggregation);
      await repo.delete({ indicator_id: indicatorId });
      if (dto.rules.length === 0) return [];
      const rows = dto.rules.map((r) =>
        repo.create({
          indicator_id: indicatorId,
          axis: r.axis,
          required: r.required ?? true,
          breakdown_target: r.breakdown_target ?? null,
          notes: r.notes ?? null,
        }),
      );
      return repo.save(rows);
    });

    const sorted = [...saved].sort((a, b) => a.axis.localeCompare(b.axis));

    void this.auditService.log({
      user_id: actorId,
      user_name: actorName,
      action: 'update',
      resource: 'indicator_disaggregations',
      resource_id: indicatorId,
      before_data: before,
      after_data: sorted,
    });

    return sorted;
  }

  async getRollup(
    indicatorId: string,
    axis: DisaggregationAxis,
  ): Promise<DisaggregationRollup> {
    await this.assertIndicatorExists(indicatorId);

    const rows = await this.breakdownsRepo
      .createQueryBuilder('b')
      .innerJoin(
        'indicator_progress',
        'p',
        'p.id = b.progress_id AND p.indicator_id = :indicatorId',
        { indicatorId },
      )
      .where('b.axis = :axis', { axis })
      .getMany();

    const buckets: Record<string, number> = {};
    for (const row of rows) {
      for (const [bucket, value] of Object.entries(row.value_breakdown)) {
        if (typeof value !== 'number' || !Number.isFinite(value)) continue;
        buckets[bucket] = (buckets[bucket] ?? 0) + value;
      }
    }
    const total = Object.values(buckets).reduce((a, b) => a + b, 0);

    const rule = await this.rulesRepo.findOne({
      where: { indicator_id: indicatorId, axis },
    });
    const target = rule?.breakdown_target ?? null;

    const gap = target ? this.computeGap(axis, target, buckets, total) : null;
    return { axis, total, buckets, target, gap };
  }

  private computeGap(
    axis: DisaggregationAxis,
    target: Record<string, number>,
    buckets: Record<string, number>,
    total: number,
  ): Record<string, number> {
    const ratio = RATIO_AXES.has(axis);
    const gap: Record<string, number> = {};
    for (const [bucket, t] of Object.entries(target)) {
      const actual = buckets[bucket] ?? 0;
      if (ratio) {
        const share = total > 0 ? actual / total : 0;
        gap[bucket] = t - share;
      } else {
        gap[bucket] = t - actual;
      }
    }
    return gap;
  }

  async persistBreakdowns(
    progressId: string,
    progressValue: number,
    breakdowns: ProgressBreakdownDto[],
  ): Promise<void> {
    if (!breakdowns.length) return;

    const seenAxes = new Set<string>();
    for (const b of breakdowns) {
      if (seenAxes.has(b.axis)) {
        this.logger.warn(
          `Duplicate axis '${b.axis}' in breakdowns for progress ${progressId}; keeping last`,
        );
      }
      seenAxes.add(b.axis);

      const sum = Object.values(b.value_breakdown).reduce(
        (a, n) => a + (typeof n === 'number' ? n : 0),
        0,
      );
      if (sum > progressValue + 1e-9) {
        this.logger.warn(
          `Breakdown sum ${sum} exceeds progress value ${progressValue} on axis '${b.axis}' for progress ${progressId}`,
        );
      }
    }

    const rows = breakdowns.map((b) =>
      this.breakdownsRepo.create({
        progress_id: progressId,
        axis: b.axis,
        value_breakdown: b.value_breakdown,
      }),
    );
    await this.breakdownsRepo.save(rows);
  }

  private async assertIndicatorExists(indicatorId: string): Promise<void> {
    const exists = await this.indicatorRepo.existsBy({ id: indicatorId });
    if (!exists) throw new NotFoundException('Indicator not found');
  }
}
