import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

export type PiiAccessAction =
  | 'view'
  | 'export'
  | 'update'
  | 'withdraw'
  | 'create'
  | 'delete';

@Entity('pii_access_log')
export class PiiAccessLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  user_id: string;

  @Column({ type: 'varchar', length: 255 })
  user_email: string;

  @Column({ type: 'uuid', nullable: true })
  beneficiary_id: string | null;

  @Column({ type: 'varchar', length: 30 })
  action: PiiAccessAction;

  @Column({ type: 'text', nullable: true })
  reason: string | null;

  @Column({ type: 'varchar', length: 40, nullable: true })
  request_id: string | null;

  @Column({ type: 'inet', nullable: true })
  ip_address: string | null;

  @Column({ type: 'text', nullable: true })
  user_agent: string | null;

  @CreateDateColumn({ type: 'timestamptz', name: 'accessed_at' })
  accessed_at: Date;
}
