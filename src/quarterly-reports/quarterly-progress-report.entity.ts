import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export interface UnanticipatedResult {
  category:
    | 'gender'
    | 'climate'
    | 'civil_society'
    | 'private_sector'
    | 'hiv_aids'
    | 'other';
  text: string;
}

/**
 * Phase 9.5 — QPR narrative payload.
 *
 * One row per (year, quarter). Carries the free-text fields the PDF
 * template asks for in sections A.2 (executive summary), B.1 (PDO
 * assessment), B.4 (unanticipated results), C.5 (Bank / Borrower /
 * co-financier performance), the PMT status narrative (A.1 tail), and
 * the AWP narrative for the next quarter (C.2.2 lead-in).
 *
 * UPSERT semantics — generating a report for the same (year, quarter)
 * updates the existing row instead of duplicating.
 */
@Entity('quarterly_progress_reports')
@Index('qpr_year_quarter_uniq', ['year', 'quarter'], { unique: true })
export class QuarterlyProgressReport {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'int' })
  year: number;

  @Column({ type: 'int' })
  quarter: number;

  @Column({ type: 'text', default: '' })
  executive_summary: string;

  @Column({ type: 'text', default: '' })
  pdo_assessment: string;

  @Column({ type: 'jsonb', default: '[]' })
  unanticipated_results: UnanticipatedResult[];

  @Column({ type: 'text', default: '' })
  bank_performance_assessment: string;

  @Column({ type: 'text', default: '' })
  borrower_performance_assessment: string;

  @Column({ type: 'text', default: '' })
  cofinancier_performance_assessment: string;

  @Column({ type: 'text', default: '' })
  pmt_status: string;

  @Column({ type: 'text', default: '' })
  awp_planned_next_qtr: string;

  @Column({ type: 'timestamptz', nullable: true })
  generated_at: Date | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  generated_by: string | null;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;
}
