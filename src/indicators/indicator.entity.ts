import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { LogframeNode } from '../logframe/logframe-node.entity.js';

@Entity('indicators')
@Index('indicators_code_kind_uniq', ['code', 'kind'], { unique: true })
export class Indicator {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 50 })
  code: string;

  @Column({ type: 'varchar', length: 500 })
  name: string;

  @Column({ type: 'text' })
  description: string;

  // 'alignment' | 'impact' | 'outcome' | 'output' | 'activity' (DB CHECK)
  @Column({ type: 'varchar', length: 20 })
  level: string;

  // AfDB RBM discriminator: 'alignment' | 'outcome' | 'output' | 'activity'
  @Column({ type: 'varchar', length: 30, default: 'output' })
  kind: string;

  @Column({ type: 'varchar', length: 100 })
  unit: string;

  @Column({ type: 'numeric', default: 0 })
  baseline: number;

  @Column({ type: 'numeric' })
  target: number;

  @Column({ type: 'numeric', default: 0 })
  current_value: number;

  @Column({ type: 'varchar', length: 20 })
  status: string;

  // 'monthly' | 'quarterly' | 'bi_annually' | 'annually' | 'mid_term' | 'one_off'
  @Column({ type: 'varchar', length: 20 })
  frequency: string;

  @Column({ type: 'text', nullable: true })
  methodology: string | null;

  @Column({ type: 'boolean', default: false })
  rmf_adoa: boolean;

  // 'cumulative' | 'incremental' | 'binary'
  @Column({ type: 'varchar', length: 20, default: 'cumulative' })
  target_mode: string;

  // 'form_submission' | 'tracer_study' | 'contractor_report'
  // | 'financial_statement' | 'policy_document' | 'external_feed' | 'manual'
  @Column({ type: 'varchar', length: 30, default: 'form_submission' })
  data_source_type: string;

  @Column({ type: 'int', nullable: true })
  reporting_year_start: number | null;

  @Column({ type: 'int', nullable: true })
  reporting_year_end: number | null;

  @Column({ type: 'uuid', nullable: true })
  logframe_level_id: string | null;

  @ManyToOne(() => LogframeNode, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'logframe_level_id' })
  logframe_node: LogframeNode | null;

  @Column({ type: 'int', array: true, default: '{}' })
  sdg_ids: number[];

  @Column({ type: 'varchar', length: 255 })
  responsible_party: string;

  @Column({ type: 'text' })
  means_of_verification: string;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;
}
