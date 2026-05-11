import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  ManyToMany,
  JoinTable,
} from 'typeorm';
import { User } from '../users/user.entity.js';
import { Cohort } from './cohort.entity.js';

export type BeneficiarySex = 'female' | 'male' | 'other' | 'prefer_not';
export type BeneficiaryAgeBand = 'under_18' | '18_24' | '25_34' | '35_plus';
export type ConsentMethod =
  | 'paper_signature'
  | 'digital_signature'
  | 'verbal_recorded'
  | 'sms_opt_in';

@Entity('beneficiaries')
export class Beneficiary {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  full_name: string;

  @Column({ type: 'varchar', length: 10 })
  sex: BeneficiarySex;

  @Column({ type: 'date', nullable: true })
  date_of_birth: string | null;

  @Column({ type: 'varchar', length: 20, nullable: true })
  age_band: BeneficiaryAgeBand | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  community: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  household_id: string | null;

  @Column({ type: 'varchar', length: 20, nullable: true })
  phone_e164: string | null;

  @Column({ type: 'varchar', length: 64, nullable: true })
  national_id_hash: string | null;

  @Column({ type: 'varchar', length: 40, nullable: true })
  skill_level: string | null;

  @Column({ type: 'boolean', default: false })
  disability_status: boolean;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @Column({ type: 'boolean', default: false })
  consent_given: boolean;

  @Column({ type: 'timestamptz', nullable: true })
  consent_date: Date | null;

  @Column({ type: 'varchar', length: 50, nullable: true })
  consent_method: ConsentMethod | null;

  @Column({ type: 'boolean', default: true })
  active: boolean;

  @Column({ type: 'timestamptz', nullable: true })
  withdrawn_at: Date | null;

  @Column({ type: 'uuid' })
  created_by: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'created_by' })
  creator: User;

  @ManyToMany(() => Cohort)
  @JoinTable({
    name: 'beneficiary_cohorts',
    joinColumn: { name: 'beneficiary_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'cohort_id', referencedColumnName: 'id' },
  })
  cohorts: Cohort[];

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;
}
