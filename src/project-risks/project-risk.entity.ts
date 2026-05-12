import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

/**
 * Phase 9.5 — QPR section A.3 (Issues, challenges, risks, actions).
 *
 * Soft-deletable via `resolved_at` — resolved risks stay in history but
 * the active list filters them out. Service-layer ordering: open first
 * (status != 'finalized'), then by deadline.
 */
@Entity('project_risks')
export class ProjectRisk {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'text' })
  key_issue: string;

  @Column({ type: 'text', default: '' })
  corrective_action: string;

  @Column({ type: 'varchar', length: 255, default: '' })
  responsibility: string;

  @Column({ type: 'date', nullable: true })
  deadline: Date | null;

  // 'pending_initiation' | 'in_progress' | 'finalized'
  @Column({ type: 'varchar', length: 20, default: 'pending_initiation' })
  status: string;

  @Column({ type: 'text', default: '' })
  comments: string;

  @Column({ type: 'timestamptz', nullable: true })
  resolved_at: Date | null;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;
}
