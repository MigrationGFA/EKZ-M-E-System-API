import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity('indicator_year_targets')
@Index('indicator_year_targets_year_idx', ['year'])
export class IndicatorYearTarget {
  @PrimaryColumn({ type: 'uuid' })
  indicator_id: string;

  @PrimaryColumn({ type: 'int' })
  year: number;

  @Column({ type: 'numeric' })
  target_value: number;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;
}
