import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Unique,
} from 'typeorm';
import { Indicator } from './indicator.entity.js';

export type DisaggregationAxisValue =
  | 'sex'
  | 'age_band'
  | 'cohort'
  | 'skill_level'
  | 'geography'
  | 'university_origin';

@Entity('indicator_disaggregations')
@Unique('indicator_disaggregations_indicator_axis_uq', ['indicator_id', 'axis'])
export class IndicatorDisaggregation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  indicator_id: string;

  @ManyToOne(() => Indicator, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'indicator_id' })
  indicator: Indicator;

  @Column({ type: 'varchar', length: 40 })
  axis: DisaggregationAxisValue;

  @Column({ type: 'boolean', default: true })
  required: boolean;

  @Column({ type: 'jsonb', nullable: true })
  breakdown_target: Record<string, number> | null;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;
}
