import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';

@Entity('logframe_nodes')
export class LogframeNode {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 50, default: 'lf_1' })
  logframe_id: string;

  @Column({ type: 'varchar', length: 20 })
  type: string;

  @Column({ type: 'varchar', length: 50 })
  code: string;

  @Column({ type: 'text' })
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ type: 'uuid', nullable: true })
  parent_id: string | null;

  @ManyToOne(() => LogframeNode, (node) => node.children, {
    onDelete: 'RESTRICT',
    nullable: true,
  })
  @JoinColumn({ name: 'parent_id' })
  parent: LogframeNode | null;

  @OneToMany(() => LogframeNode, (node) => node.parent)
  children: LogframeNode[];

  @Column({ type: 'int', default: 0 })
  order: number;

  // Component nodes carry a budget envelope (per ADR 0002). NULL on every
  // other node type.
  @Column({ type: 'numeric', nullable: true })
  budget_usd: number | null;

  @Column({ type: 'varchar', length: 10, default: 'USD' })
  budget_currency: string;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;
}
