import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

/**
 * Phase 9.5 — QPR section C.1.2 Compliance with environmental & social
 * safeguards. One row per safeguard measure group (ESMP / RAP / other),
 * rolling up status counts and budget allocation/disbursement.
 */
@Entity('safeguard_measures')
export class SafeguardMeasure {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // 'esmp' | 'rap' | 'other'
  @Column({ type: 'varchar', length: 20 })
  type: string;

  @Column({ type: 'varchar', length: 255 })
  measure_name: string;

  @Column({ type: 'int', default: 0 })
  total_count: number;

  @Column({ type: 'int', default: 0 })
  not_started_count: number;

  @Column({ type: 'int', default: 0 })
  ongoing_count: number;

  @Column({ type: 'int', default: 0 })
  completed_count: number;

  @Column({
    type: 'numeric',
    precision: 18,
    scale: 2,
    default: 0,
    transformer: {
      to: (v: number) => v,
      from: (v: string) => Number(v),
    },
  })
  budget_allocated_ua: number;

  @Column({
    type: 'numeric',
    precision: 18,
    scale: 2,
    default: 0,
    transformer: {
      to: (v: number) => v,
      from: (v: string) => Number(v),
    },
  })
  amount_disbursed_ua: number;

  @Column({ type: 'int', default: 0 })
  order: number;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;
}
