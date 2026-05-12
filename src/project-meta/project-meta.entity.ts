import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

/**
 * Single-row table holding project-level metadata: PDO text, baseline /
 * completion years, and the chronological midpoint date used by the
 * scheduler (Phase 8) and reports (Phase 9).
 *
 * pdo_node_id is a soft FK to logframe_nodes(id) — see
 * docs/afdb-alignment/decisions/0002-hierarchy.md and migration
 * 1700000000010-LogframeHierarchyV2 for the constraint definition.
 */
@Entity('project_meta')
export class ProjectMeta {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  sap_code: string | null;

  @Column({ type: 'text' })
  pdo_text: string;

  @Column({ type: 'int' })
  baseline_year: number;

  @Column({ type: 'int' })
  completion_year: number;

  @Column({ type: 'date', nullable: true })
  midpoint_date: Date | null;

  @Column({ type: 'uuid', nullable: true })
  pdo_node_id: string | null;

  // ─── Phase 9.5 — QPR cover-page widening (template A.1) ───────────────

  @Column({ type: 'varchar', length: 100, nullable: true })
  sector: string | null;

  @Column({ type: 'varchar', length: 100, default: 'Nigeria' })
  country: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  executing_agency: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  responsible_project_staff: string | null;

  @Column({ type: 'date', nullable: true })
  original_disbursement_deadline: Date | null;

  @Column({ type: 'date', nullable: true })
  revised_disbursement_deadline: Date | null;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;
}
