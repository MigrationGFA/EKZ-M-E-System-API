import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

@Entity('reports')
export class Report {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 500 })
  title: string;

  @Column({ type: 'varchar', length: 255 })
  generated_by: string;

  @Column({ type: 'timestamptz' })
  generated_at: Date;

  @Column({ type: 'varchar', length: 20 })
  format: string;

  @Column({ type: 'jsonb', default: '{}' })
  filters: Record<string, any>;

  @Column({ type: 'text', default: '#' })
  download_url: string;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;
}
