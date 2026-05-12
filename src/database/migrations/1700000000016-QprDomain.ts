import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Phase 9.5 — Quarterly Progress Report (QPR) domain.
 *
 * Lands seven new tables + two ALTERs so the server-rendered PDF can match
 * the AfDB Quarterly Project Progress Report template (Client-Update/
 * request.pdf). All ALTERs are additive — no column drops, no CHECK
 * widening that would break Phase-1–9 data.
 *
 * Tables introduced:
 *   - project_financing_sources  (A.1 financing-source/instrument rows)
 *   - project_risks              (A.3 issues / challenges / actions)
 *   - quarterly_progress_reports (A.2 / B.1 / B.4 / C.5 / PMT narratives,
 *                                 keyed UNIQUE(year, quarter))
 *   - activity_quarterly_status  (C.2.1 / C.2.2 per-activity per-quarter
 *                                 status; UNIQUE(node_id, year, quarter))
 *   - project_covenants          (C.1.1)
 *   - safeguard_measures         (C.1.2 ESMP/RAP rollup)
 *   - audit_findings             (C.1.3)
 *
 * ALTERs:
 *   - project_meta: cover-page widening (sector, country, executing_agency,
 *     responsible_project_staff, original_disbursement_deadline,
 *     revised_disbursement_deadline).
 *   - indicator_year_targets: + is_original (default true), + revision_year
 *     (NULL). Existing rows backfill to is_original=true via DEFAULT.
 *     Phase-9.5 admin UI flips setYearTargets() from destructive-replace
 *     to revision-insert; expectedAt callers swap to getLatestYearTargets().
 *
 * Out of scope: procurement + financial disbursement domains. Those
 * render in the QPR PDF as structured placeholders only.
 *
 * See: docs/afdb-alignment/IMPLEMENTATION_PLAN.md (Phase 9.5)
 */
export class QprDomain_1700000000016 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // ─── ALTER project_meta ──────────────────────────────────────────────
    await queryRunner.query(`
      ALTER TABLE project_meta
        ADD COLUMN IF NOT EXISTS sector VARCHAR(100),
        ADD COLUMN IF NOT EXISTS country VARCHAR(100) NOT NULL DEFAULT 'Nigeria',
        ADD COLUMN IF NOT EXISTS executing_agency VARCHAR(255),
        ADD COLUMN IF NOT EXISTS responsible_project_staff VARCHAR(255),
        ADD COLUMN IF NOT EXISTS original_disbursement_deadline DATE,
        ADD COLUMN IF NOT EXISTS revised_disbursement_deadline DATE
    `);

    // ─── project_financing_sources ───────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS project_financing_sources (
        id                  UUID          PRIMARY KEY DEFAULT uuid_generate_v4(),
        project_meta_id     UUID          NOT NULL REFERENCES project_meta(id) ON DELETE CASCADE,
        source_name         VARCHAR(255)  NOT NULL,
        instrument          VARCHAR(50)   NOT NULL,
        total_approved_ua   NUMERIC(18,2) NOT NULL DEFAULT 0,
        disbursed_ua        NUMERIC(18,2) NOT NULL DEFAULT 0,
        "order"             INTEGER       NOT NULL DEFAULT 0,
        created_at          TIMESTAMPTZ   NOT NULL DEFAULT now(),
        updated_at          TIMESTAMPTZ   NOT NULL DEFAULT now(),
        CONSTRAINT pfs_instrument_check
          CHECK (instrument IN ('loan', 'grant', 'cofinancing', 'counterpart'))
      )
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_pfs_project_meta
        ON project_financing_sources(project_meta_id, "order")
    `);

    // ─── project_risks ───────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS project_risks (
        id                UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
        key_issue         TEXT         NOT NULL,
        corrective_action TEXT         NOT NULL DEFAULT '',
        responsibility    VARCHAR(255) NOT NULL DEFAULT '',
        deadline          DATE,
        status            VARCHAR(20)  NOT NULL DEFAULT 'pending_initiation',
        comments          TEXT         NOT NULL DEFAULT '',
        resolved_at       TIMESTAMPTZ,
        created_at        TIMESTAMPTZ  NOT NULL DEFAULT now(),
        updated_at        TIMESTAMPTZ  NOT NULL DEFAULT now(),
        CONSTRAINT project_risks_status_check
          CHECK (status IN ('pending_initiation', 'in_progress', 'finalized'))
      )
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_project_risks_status_resolved
        ON project_risks(status, resolved_at)
    `);

    // ─── quarterly_progress_reports ──────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS quarterly_progress_reports (
        id                                  UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
        year                                INTEGER      NOT NULL,
        quarter                             INTEGER      NOT NULL,
        executive_summary                   TEXT         NOT NULL DEFAULT '',
        pdo_assessment                      TEXT         NOT NULL DEFAULT '',
        unanticipated_results               JSONB        NOT NULL DEFAULT '[]'::jsonb,
        bank_performance_assessment         TEXT         NOT NULL DEFAULT '',
        borrower_performance_assessment     TEXT         NOT NULL DEFAULT '',
        cofinancier_performance_assessment  TEXT         NOT NULL DEFAULT '',
        pmt_status                          TEXT         NOT NULL DEFAULT '',
        awp_planned_next_qtr                TEXT         NOT NULL DEFAULT '',
        generated_at                        TIMESTAMPTZ,
        generated_by                        VARCHAR(255),
        created_at                          TIMESTAMPTZ  NOT NULL DEFAULT now(),
        updated_at                          TIMESTAMPTZ  NOT NULL DEFAULT now(),
        CONSTRAINT qpr_quarter_check CHECK (quarter BETWEEN 1 AND 4),
        CONSTRAINT qpr_year_quarter_uniq UNIQUE (year, quarter)
      )
    `);

    // ─── activity_quarterly_status ───────────────────────────────────────
    // logframe_node_id is FK; service layer asserts node.type='activity'.
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS activity_quarterly_status (
        id                    UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
        logframe_node_id      UUID         NOT NULL REFERENCES logframe_nodes(id) ON DELETE CASCADE,
        year                  INTEGER      NOT NULL,
        quarter               INTEGER      NOT NULL,
        status                VARCHAR(20)  NOT NULL DEFAULT 'pending_initiation',
        pct_achievement       INTEGER      NOT NULL DEFAULT 0,
        comments              TEXT         NOT NULL DEFAULT '',
        planned_for_next_qtr  BOOLEAN      NOT NULL DEFAULT false,
        deadline              DATE,
        created_at            TIMESTAMPTZ  NOT NULL DEFAULT now(),
        updated_at            TIMESTAMPTZ  NOT NULL DEFAULT now(),
        CONSTRAINT aqs_quarter_check CHECK (quarter BETWEEN 1 AND 4),
        CONSTRAINT aqs_pct_check CHECK (pct_achievement BETWEEN 0 AND 100),
        CONSTRAINT aqs_status_check
          CHECK (status IN ('pending_initiation', 'in_progress', 'finalized', 'cancelled')),
        CONSTRAINT aqs_node_year_quarter_uniq UNIQUE (logframe_node_id, year, quarter)
      )
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_aqs_year_quarter
        ON activity_quarterly_status(year, quarter)
    `);

    // ─── ALTER indicator_year_targets ────────────────────────────────────
    // The existing composite PK (indicator_id, year) blocks revision rows.
    // Drop it, add a uuid id PK, and a (indicator_id, year, is_original)
    // UNIQUE so at most two rows per (indicator_id, year) — one original,
    // one current revision. Existing rows backfill to is_original=true.
    await queryRunner.query(`
      ALTER TABLE indicator_year_targets
        ADD COLUMN IF NOT EXISTS is_original BOOLEAN NOT NULL DEFAULT true,
        ADD COLUMN IF NOT EXISTS revision_year INTEGER,
        ADD COLUMN IF NOT EXISTS id UUID DEFAULT uuid_generate_v4()
    `);
    // Make sure existing rows have non-null ids (they should from the default),
    // then promote id to PRIMARY KEY.
    await queryRunner.query(`
      UPDATE indicator_year_targets
        SET id = uuid_generate_v4()
        WHERE id IS NULL
    `);
    await queryRunner.query(`
      ALTER TABLE indicator_year_targets
        ALTER COLUMN id SET NOT NULL,
        DROP CONSTRAINT IF EXISTS indicator_year_targets_pkey
    `);
    await queryRunner.query(`
      ALTER TABLE indicator_year_targets
        ADD PRIMARY KEY (id)
    `);
    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS iyt_indicator_year_original_uniq
        ON indicator_year_targets(indicator_id, year, is_original)
    `);

    // ─── project_covenants ───────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS project_covenants (
        id            UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
        covenant_text TEXT         NOT NULL,
        type          VARCHAR(50)  NOT NULL,
        status        VARCHAR(20)  NOT NULL DEFAULT 'pending_initiation',
        comments      TEXT         NOT NULL DEFAULT '',
        "order"       INTEGER      NOT NULL DEFAULT 0,
        created_at    TIMESTAMPTZ  NOT NULL DEFAULT now(),
        updated_at    TIMESTAMPTZ  NOT NULL DEFAULT now(),
        CONSTRAINT project_covenants_type_check
          CHECK (type IN ('entry_into_force', 'first_disbursement', 'undertaking')),
        CONSTRAINT project_covenants_status_check
          CHECK (status IN ('pending_initiation', 'in_progress', 'finalized'))
      )
    `);

    // ─── safeguard_measures ──────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS safeguard_measures (
        id                   UUID          PRIMARY KEY DEFAULT uuid_generate_v4(),
        type                 VARCHAR(20)   NOT NULL,
        measure_name         VARCHAR(255)  NOT NULL,
        total_count          INTEGER       NOT NULL DEFAULT 0,
        not_started_count    INTEGER       NOT NULL DEFAULT 0,
        ongoing_count        INTEGER       NOT NULL DEFAULT 0,
        completed_count      INTEGER       NOT NULL DEFAULT 0,
        budget_allocated_ua  NUMERIC(18,2) NOT NULL DEFAULT 0,
        amount_disbursed_ua  NUMERIC(18,2) NOT NULL DEFAULT 0,
        "order"              INTEGER       NOT NULL DEFAULT 0,
        created_at           TIMESTAMPTZ   NOT NULL DEFAULT now(),
        updated_at           TIMESTAMPTZ   NOT NULL DEFAULT now(),
        CONSTRAINT safeguard_measures_type_check
          CHECK (type IN ('esmp', 'rap', 'other'))
      )
    `);

    // ─── audit_findings ──────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS audit_findings (
        id                         UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
        year                       INTEGER      NOT NULL,
        audit_status               VARCHAR(20)  NOT NULL DEFAULT 'pending_initiation',
        key_issue                  TEXT         NOT NULL,
        corrective_measures        TEXT         NOT NULL DEFAULT '',
        comments                   TEXT         NOT NULL DEFAULT '',
        expected_submission_date   DATE,
        "order"                    INTEGER      NOT NULL DEFAULT 0,
        created_at                 TIMESTAMPTZ  NOT NULL DEFAULT now(),
        updated_at                 TIMESTAMPTZ  NOT NULL DEFAULT now(),
        CONSTRAINT audit_findings_status_check
          CHECK (audit_status IN ('pending_initiation', 'in_progress', 'finalized'))
      )
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_audit_findings_year
        ON audit_findings(year)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS audit_findings`);
    await queryRunner.query(`DROP TABLE IF EXISTS safeguard_measures`);
    await queryRunner.query(`DROP TABLE IF EXISTS project_covenants`);
    // Restore the original composite PK on indicator_year_targets. Will FAIL
    // if revision rows have been inserted (is_original=false rows would
    // duplicate (indicator_id, year)). Reverting Phase 9.5 after edits
    // requires manually de-duping first; flagged as irreversible-without-dedup
    // (same posture as Phase 2's UNIQUE(code) drop).
    await queryRunner.query(`
      DROP INDEX IF EXISTS iyt_indicator_year_original_uniq
    `);
    await queryRunner.query(`
      DELETE FROM indicator_year_targets WHERE is_original = false
    `);
    await queryRunner.query(`
      ALTER TABLE indicator_year_targets
        DROP CONSTRAINT IF EXISTS indicator_year_targets_pkey
    `);
    await queryRunner.query(`
      ALTER TABLE indicator_year_targets
        ADD PRIMARY KEY (indicator_id, year)
    `);
    await queryRunner.query(`
      ALTER TABLE indicator_year_targets
        DROP COLUMN IF EXISTS id,
        DROP COLUMN IF EXISTS revision_year,
        DROP COLUMN IF EXISTS is_original
    `);
    await queryRunner.query(`DROP TABLE IF EXISTS activity_quarterly_status`);
    await queryRunner.query(`DROP TABLE IF EXISTS quarterly_progress_reports`);
    await queryRunner.query(`DROP TABLE IF EXISTS project_risks`);
    await queryRunner.query(`DROP TABLE IF EXISTS project_financing_sources`);
    await queryRunner.query(`
      ALTER TABLE project_meta
        DROP COLUMN IF EXISTS revised_disbursement_deadline,
        DROP COLUMN IF EXISTS original_disbursement_deadline,
        DROP COLUMN IF EXISTS responsible_project_staff,
        DROP COLUMN IF EXISTS executing_agency,
        DROP COLUMN IF EXISTS country,
        DROP COLUMN IF EXISTS sector
    `);
  }
}
