import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../users/user.entity.js';
import { Indicator } from '../indicators/indicator.entity.js';
import { IndicatorProgress } from '../indicators/indicator-progress.entity.js';
import { ProjectLocation } from '../locations/project-location.entity.js';

export type DocumentType =
  | 'contractor_supervision_report'
  | 'contractor_progress_report'
  | 'third_party_monitoring_report'
  | 'financial_statement'
  | 'fund_portfolio_report'
  | 'beneficiary_tracer_study'
  | 'beneficiary_assessment'
  | 'policy_document'
  | 'mou'
  | 'incubation_report'
  | 'roadshow_report'
  | 'rap_implementation_report'
  | 'ekdipa_quarterly_report'
  | 'ekdipa_annual_report'
  | 'external_data_extract'
  | 'photo_evidence'
  | 'audit_report'
  | 'other';

@Entity('evidence_documents')
export class EvidenceDocument {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 500 })
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ type: 'varchar', length: 50 })
  document_type: DocumentType;

  @Column({ type: 'jsonb', default: () => "'{}'::jsonb" })
  type_metadata: Record<string, unknown>;

  @Column({ type: 'date', nullable: true })
  reference_period_from: string | null;

  @Column({ type: 'date', nullable: true })
  reference_period_to: string | null;

  @Column({ type: 'timestamptz', nullable: true })
  retention_until: Date | null;

  @Column({ type: 'text' })
  file_url: string;

  @Column({ type: 'bigint' })
  file_size_bytes: string;

  @Column({ type: 'varchar', length: 100 })
  mime_type: string;

  @Column({ type: 'varchar', length: 64 })
  sha256: string;

  @Column({ type: 'uuid' })
  uploaded_by: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'uploaded_by' })
  uploader: User;

  @CreateDateColumn({ name: 'uploaded_at', type: 'timestamptz' })
  uploaded_at: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;

  @DeleteDateColumn({ type: 'timestamptz', nullable: true })
  deleted_at: Date | null;

  @Column({ type: 'uuid', nullable: true })
  supersedes_id: string | null;

  @ManyToOne(() => EvidenceDocument, { nullable: true })
  @JoinColumn({ name: 'supersedes_id' })
  supersedes: EvidenceDocument | null;

  @Column({ type: 'uuid', nullable: true })
  indicator_id: string | null;

  @ManyToOne(() => Indicator, { nullable: true })
  @JoinColumn({ name: 'indicator_id' })
  indicator: Indicator | null;

  @Column({ type: 'uuid', nullable: true })
  indicator_progress_id: string | null;

  @ManyToOne(() => IndicatorProgress, { nullable: true })
  @JoinColumn({ name: 'indicator_progress_id' })
  indicator_progress: IndicatorProgress | null;

  @Column({ type: 'uuid', nullable: true })
  location_id: string | null;

  @ManyToOne(() => ProjectLocation, { nullable: true })
  @JoinColumn({ name: 'location_id' })
  location: ProjectLocation | null;
}
