import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../users/user.entity.js';

@Entity('forms')
export class Form {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 500 })
  title: string;

  @Column({ type: 'text', default: '' })
  description: string;

  @Column({ type: 'jsonb', default: '[]' })
  fields: any[];

  @Column({ type: 'jsonb', default: '[]' })
  field_mappings: Array<{
    form_field_id: string;
    indicator_id: string;
    transform?: 'latest' | 'sum' | 'average';
    /**
     * Phase 5: optional disaggregation auto-mapping. When `axis` is set, the
     * auto-created indicator_progress row carries a breakdown derived from
     * the linked beneficiary's attribute (`beneficiary_attr`). If no
     * beneficiary is linked or the attribute is unset, `static_bucket` is
     * used as a fallback bucket name; otherwise the breakdown is skipped.
     */
    axis?: 'sex' | 'age_band' | 'cohort' | 'skill_level';
    beneficiary_attr?: 'sex' | 'age_band' | 'cohort' | 'skill_level';
    static_bucket?: string;
  }>;

  @Column({ type: 'uuid', array: true, default: '{}' })
  indicator_ids: string[];

  @Column({ type: 'uuid', array: true, default: '{}' })
  assigned_to: string[];

  @Column({ type: 'uuid', array: true, default: '{}' })
  location_ids: string[];

  @Column({ type: 'boolean', default: false })
  require_gps: boolean;

  @Column({ type: 'uuid' })
  created_by: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'created_by' })
  creator: User;

  @Column({ type: 'varchar', length: 20, default: 'draft' })
  status: string;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;
}
