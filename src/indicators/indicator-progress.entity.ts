import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Indicator } from './indicator.entity.js';

@Entity('indicator_progress')
export class IndicatorProgress {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  indicator_id: string;

  @ManyToOne(() => Indicator, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'indicator_id' })
  indicator: Indicator;

  @Column({ type: 'numeric' })
  value: number;

  @Column({ type: 'timestamptz' })
  date: Date;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @Column({ type: 'varchar', length: 255 })
  submitted_by: string;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;
}
