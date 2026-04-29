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
