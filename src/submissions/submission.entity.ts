import {
  Entity,
  PrimaryColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { Form } from '../forms/form.entity.js';
import { User } from '../users/user.entity.js';
import { ProjectLocation } from '../locations/project-location.entity.js';
import { Beneficiary } from '../beneficiaries/beneficiary.entity.js';

@Entity('submissions')
export class Submission {
  @PrimaryColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  form_id: string;

  @ManyToOne(() => Form)
  @JoinColumn({ name: 'form_id' })
  form: Form;

  @Column({ type: 'uuid' })
  officer_id: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'officer_id' })
  officer: User;

  @Column({ type: 'jsonb' })
  data: Record<string, any>;

  @Column({ type: 'jsonb', nullable: true })
  location: { lat: number; lng: number } | null;

  @Column({ type: 'uuid', nullable: true })
  location_id: string | null;

  @ManyToOne(() => ProjectLocation, { nullable: true })
  @JoinColumn({ name: 'location_id' })
  project_location: ProjectLocation | null;

  @Column({ type: 'boolean', nullable: true })
  on_site: boolean | null;

  @Column({ type: 'uuid', nullable: true })
  beneficiary_id: string | null;

  @ManyToOne(() => Beneficiary, { nullable: true })
  @JoinColumn({ name: 'beneficiary_id' })
  beneficiary: Beneficiary | null;

  @Column({ type: 'timestamptz' })
  submitted_at: Date;

  @Column({ type: 'varchar', length: 20, default: 'pending' })
  validation_status: string;

  @Column({ type: 'text', nullable: true })
  validation_comment: string | null;

  @CreateDateColumn({ type: 'timestamptz' })
  synced_at: Date;
}
