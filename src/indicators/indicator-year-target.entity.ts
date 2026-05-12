import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

/**
 * Phase 3 — multi-year target rows. Phase 9.5 widened the schema with
 * `is_original` + `revision_year` and replaced the composite PK
 * `(indicator_id, year)` with a uuid PK so revisions can coexist with
 * originals. UNIQUE `(indicator_id, year, is_original)` permits exactly
 * one original row + one revision row per (indicator, year).
 */
@Entity('indicator_year_targets')
@Index('indicator_year_targets_year_idx', ['year'])
@Index(
  'iyt_indicator_year_original_uniq',
  ['indicator_id', 'year', 'is_original'],
  {
    unique: true,
  },
)
export class IndicatorYearTarget {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  indicator_id: string;

  @Column({ type: 'int' })
  year: number;

  @Column({ type: 'numeric' })
  target_value: number;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  // Phase 9.5 — PAR-baseline rows: true. Live/revised rows: false.
  @Column({ type: 'boolean', default: true })
  is_original: boolean;

  // Phase 9.5 — calendar year the latest revision was entered (null on
  // originals). Display-only; the (indicator_id, year, is_original) UNIQUE
  // is the constraint that prevents duplicates.
  @Column({ type: 'int', nullable: true })
  revision_year: number | null;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;
}
