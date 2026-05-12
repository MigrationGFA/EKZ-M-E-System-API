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

/**
 * Phase 9.5 — QPR section C.2.1 / C.2.2.
 *
 * Per logframe activity × per quarter. Service-layer asserts that the
 * referenced node has type='activity' (not enforced in DB to avoid a
 * cross-table CHECK).
 *
 * UPSERT semantics keyed by (logframe_node_id, year, quarter).
 */
@Entity('activity_quarterly_status')
@Index('aqs_node_year_quarter_uniq', ['logframe_node_id', 'year', 'quarter'], {
  unique: true,
})
export class ActivityQuarterlyStatus {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  logframe_node_id: string;

  @ManyToOne(() => LogframeNode, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'logframe_node_id' })
  logframe_node: LogframeNode;

  @Column({ type: 'int' })
  year: number;

  @Column({ type: 'int' })
  quarter: number;

  // 'pending_initiation' | 'in_progress' | 'finalized' | 'cancelled'
  @Column({ type: 'varchar', length: 20, default: 'pending_initiation' })
  status: string;

  @Column({ type: 'int', default: 0 })
  pct_achievement: number;

  @Column({ type: 'text', default: '' })
  comments: string;

  @Column({ type: 'boolean', default: false })
  planned_for_next_qtr: boolean;

  @Column({ type: 'date', nullable: true })
  deadline: Date | null;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;
}
