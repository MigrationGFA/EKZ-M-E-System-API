import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { ProjectMeta } from '../project-meta/project-meta.entity.js';

/**
 * Phase 9.5 — A.1 financing source/instrument row.
 *
 * One row per AfDB financing instrument + counterpart funding source.
 * Aggregated by the QPR PDF cover page into the "Financing source"
 * table (per-source approved/disbursed UA).
 */
@Entity('project_financing_sources')
export class ProjectFinancingSource {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  project_meta_id: string;

  @ManyToOne(() => ProjectMeta, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'project_meta_id' })
  project_meta: ProjectMeta;

  @Column({ type: 'varchar', length: 255 })
  source_name: string;

  // 'loan' | 'grant' | 'cofinancing' | 'counterpart' (DB CHECK)
  @Column({ type: 'varchar', length: 50 })
  instrument: string;

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
  total_approved_ua: number;

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
  disbursed_ua: number;

  @Column({ type: 'int', default: 0 })
  order: number;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;
}
