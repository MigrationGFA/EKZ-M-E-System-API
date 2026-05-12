import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

/**
 * Phase 9.5 — QPR section C.1.1 Compliance with project covenants.
 */
@Entity('project_covenants')
export class ProjectCovenant {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'text' })
  covenant_text: string;

  // 'entry_into_force' | 'first_disbursement' | 'undertaking'
  @Column({ type: 'varchar', length: 50 })
  type: string;

  // 'pending_initiation' | 'in_progress' | 'finalized'
  @Column({ type: 'varchar', length: 20, default: 'pending_initiation' })
  status: string;

  @Column({ type: 'text', default: '' })
  comments: string;

  @Column({ type: 'int', default: 0 })
  order: number;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;
}
