import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { IndicatorProgress } from './indicator-progress.entity.js';
import type { DisaggregationAxisValue } from './indicator-disaggregation.entity.js';

@Entity('indicator_progress_breakdowns')
@Index('indicator_progress_breakdowns_axis_idx', ['axis'])
export class IndicatorProgressBreakdown {
  @PrimaryColumn({ type: 'uuid', name: 'progress_id' })
  progress_id: string;

  @ManyToOne(() => IndicatorProgress, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'progress_id' })
  progress: IndicatorProgress;

  @PrimaryColumn({ type: 'varchar', length: 40 })
  axis: DisaggregationAxisValue;

  @Column({ type: 'jsonb' })
  value_breakdown: Record<string, number>;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;
}
