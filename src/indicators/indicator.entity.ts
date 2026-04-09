import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { LogframeNode } from '../logframe/logframe-node.entity.js';

@Entity('indicators')
export class Indicator {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 50, unique: true })
  code: string;

  @Column({ type: 'varchar', length: 500 })
  name: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'varchar', length: 20 })
  level: string;

  @Column({ type: 'varchar', length: 100 })
  unit: string;

  @Column({ type: 'numeric', default: 0 })
  baseline: number;

  @Column({ type: 'numeric' })
  target: number;

  @Column({ type: 'numeric', default: 0 })
  current_value: number;

  @Column({ type: 'varchar', length: 20 })
  status: string;

  @Column({ type: 'varchar', length: 20 })
  frequency: string;

  @Column({ type: 'uuid', nullable: true })
  logframe_level_id: string | null;

  @ManyToOne(() => LogframeNode, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'logframe_level_id' })
  logframe_node: LogframeNode | null;

  @Column({ type: 'int', array: true, default: '{}' })
  sdg_ids: number[];

  @Column({ type: 'varchar', length: 255 })
  responsible_party: string;

  @Column({ type: 'text' })
  means_of_verification: string;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;
}
