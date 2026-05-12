import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

/**
 * Phase 9.5 — QPR section C.1.3 Audit compliance. Captures outstanding
 * audit reports + their key issues with corrective measures.
 */
@Entity('audit_findings')
export class AuditFinding {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'int' })
  year: number;

  // 'pending_initiation' | 'in_progress' | 'finalized'
  @Column({ type: 'varchar', length: 20, default: 'pending_initiation' })
  audit_status: string;

  @Column({ type: 'text' })
  key_issue: string;

  @Column({ type: 'text', default: '' })
  corrective_measures: string;

  @Column({ type: 'text', default: '' })
  comments: string;

  @Column({ type: 'date', nullable: true })
  expected_submission_date: Date | null;

  @Column({ type: 'int', default: 0 })
  order: number;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;
}
