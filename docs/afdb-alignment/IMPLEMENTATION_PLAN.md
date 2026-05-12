# EKZ M&E — Phased Implementation Plan

**Status:** Draft for review · 2026-05-07
**Scope:** Aligning the system structure to the AfDB-grade Results Framework + Monitoring Plan delivered by the client (see [Client-Update/](Client-Update/))
**Out of scope (this plan):** Seed data ingestion. The structural foundation must be locked before we can sensibly seed the real indicators, year targets, components, and cohorts. A separate seeding phase is sketched at the end as Phase 10.

> Companion docs:
> - [AUDIT_FINDINGS.md](AUDIT_FINDINGS.md) — current security/correctness gaps (independent track)
> - [CLAUDE.md](CLAUDE.md) — current architecture
> - [Client-Update/Result-FrameWork.md](Client-Update/Result-FrameWork.md) — contractual targets
> - [Client-Update/Monitoring-plans.md](Client-Update/Monitoring-plans.md) — methodology + multi-year milestones

---

## 0. Why this plan exists

The system as built models a generic 4-tier logframe (`goal → outcome → output → activity`) with a single completion target per indicator and a free-form `frequency` enum. The client documents demand a richer model:

| Concept (client docs) | Currently | Gap |
|---|---|---|
| **PDO → Components → Output Statements → Indicators** AND **PDO → Outcome Statements → Indicators** (parallel branches) | Linear `goal → outcome → output → activity` only | Hierarchy is wrong; needs `component` and `output_statement` levels, and outcomes must be siblings of components, not parents of outputs |
| Multi-year targets (2023, 2026, 2028 + completion 2028) | Single `target` numeric | New table required |
| Cumulative vs incremental target semantics | `computeStatus(current, target)` is unaware of year/mode | Status logic must be year-aware |
| Disaggregation (sex / age / community / skill level / 70%-youth / 40%-women) | Free-text in `description` | First-class table |
| RMF/ADOA flag | Not modelled | New boolean |
| Methodology field per indicator | Not modelled | New text column |
| Frequency `mid_term`, `one_off` | Enum locked to monthly/quarterly/bi_annually/annually | CHECK must be widened; scheduler logic extended |
| Affected-community cohorts (Ago Araromi, Ijan-Ekiti) | No beneficiary registry | New tables (PII-bearing) |
| Document/narrative MoV (contractor reports, financial statements, policy docs) | Only photo uploads via Azure | New evidence-document store |
| External data feeds (NBS, Fund Manager portfolio, SPV financials) | Treated as ordinary indicator progress entries | New `data_source_type` to drive UI affordances |
| Indicator code uniqueness (Outcome 1.1 vs Output 1.1 collide) | `UNIQUE` on `indicators.code` | Composite uniqueness required |

This plan takes those gaps and sequences them into ten phases with explicit dependencies. Each phase declares its own deliverables, schema deltas, code touch-points, and definition of done.

---

## Notation used throughout

- **Schema** — DB migrations, with file names following the existing `1700000000NNN-<Title>.ts` convention.
- **Backend** — NestJS files under `ekz-server/src/`.
- **Frontend** — Next.js files under `ekz/`.
- **Mocks** — MSW handlers under `ekz/mocks/` must be updated in lock-step with backend API changes.
- **DoD** — Definition of Done. Concrete pass/fail conditions.
- **🚧 Blocks:** another phase cannot start until this is complete.
- **🟡 Soft-deps:** can proceed in parallel with caveats.

---

# Phase 0 — Reconciliation & Locked Decisions

**Goal:** Get unambiguous answers to the open questions in the client docs **before** writing schema. Every contradiction we accept silently here becomes a future migration.

**Owner:** Project lead + client (EKDIPA M&E focal point) + AfDB supervision contact.

**Inputs to send to client:**

1. **Target reconciliation memo.** Both client docs disagree on ten or so end-of-project numbers. Surface them in a one-page table and ask which doc wins. Examples:

   | Indicator | RF (2028) | Monitoring Plan (2028) |
   |---|---|---|
   | 1.1 Direct jobs | 7,007 | 49,045 *(likely typo — 30%-mid 2,102.1 = 30% × 7,007)* |
   | 1.2 Indirect jobs | 18,935 | 13,245 *(but 30%-mid says 5,681 = 30% × 18,936)* |
   | Outcome 2.1 ICT youth | 4,800 | 3,800 |
   | 3.1 Firms | 15 | 10 |
   | 3.2 Operating revenue | $10.8M | $5M |
   | 3.3 Additional financing | $5M | $4M |
   | Output 1.2 Buildings | 12 | 10 |
   | Output 3.1 Centers of excellence | 10 | 10 ✓ (consistent if read as incremental) |
   | Output 6.4 Roadshows | 5 | 1 |

2. **Hierarchy interpretation.** Confirm:
   - Outcomes are tracked **independently of** components (a parallel branch under PDO), not as parents of outputs.
   - Each Output **belongs to exactly one Component**.
   - The PDO is a single root node.

3. **Cohort definition.** Confirm names/codes for:
   - `affected_ago_araromi`
   - `affected_ijan_ekiti`
   - `youth_70pct` (target subgroup)
   - `women_40pct`
   - `female_led_startup`
   - `affected_household_youth_4_1` (the 500 youth from affected HHs in Output 4.1)
   - whether more cohorts are anticipated

4. **Alignment indicators.** Are youth-unemployment and poverty-line tracked by us (manual data entry, low-frequency), or are they truly context-only and live outside the system?

5. **Reporting cadence locks.**
   - Confirm `mid_term` indicators have a **fixed midpoint date** (e.g. 2025-12-31) we should hard-code, vs being relative to the active project record's start/end dates.
   - Confirm twice-yearly Bank supervisions map to `bi_annually` for any indicator that should match.

6. **Document classes.** What document types do we need (contractor supervision report, RAP report, policy document, financial statement, tracer study, MoU…)? Get the canonical list from the client.

7. **PII policy for beneficiaries.** What can we collect, store, and export? Are NINs allowed? Phone numbers? Are pictures of beneficiaries allowed? At minimum we need: full name, sex, age band, community, skill level captured at training intake.

**Deliverables:** All six ADRs are now **drafted with Proposed status** — pre-loaded with industry-standard defaults (AfDB Results-Based Management, NDPR/NDPA 2023, AfDB Operational Safeguards). They unblock Phase 1+ on the assumption the client will confirm; flag any disagreement and we revise.

- [docs/decisions/0001-target-reconciliation.md](docs/decisions/0001-target-reconciliation.md) — RF wins on completion targets; MP supplies milestones; explicit per-indicator resolutions for all conflicts
- [docs/decisions/0002-hierarchy.md](docs/decisions/0002-hierarchy.md) — single-PDO root, parallel outcome/component branches, outcome→output linkage as informational join
- [docs/decisions/0003-cohort-catalogue.md](docs/decisions/0003-cohort-catalogue.md) — 12 pre-seeded cohorts including affected communities, demographic targets, derived rollups
- [docs/decisions/0004-frequency-and-cadence.md](docs/decisions/0004-frequency-and-cadence.md) — frequency enum extended with `mid_term` and `one_off`; project anchor dates locked (baseline 2022, midpoint 2025-06-30, completion 2028-12-31)
- [docs/decisions/0005-document-types.md](docs/decisions/0005-document-types.md) — 18-value enum with per-type required metadata and retention defaults
- [docs/decisions/0006-pii-policy.md](docs/decisions/0006-pii-policy.md) — NDPR/NDPA-aligned policy: explicit consent, hashed-only NIN, dedicated PII access log, 5-year post-completion retention then anonymise

**DoD:** Decisions drafted as ADRs (✓). For full lock, client and Safeguards Officer must confirm. Any "Proposed" → "Accepted" status change is in-place edit + sign-off note in the ADR.

**🚧 Blocks:** Phases 1, 2, 3, 4, 5, 6, 10.

---

# Phase 1 — Logframe Hierarchy Expansion

**Goal:** Replace the linear `goal → outcome → output → activity` model with the AfDB structure. Make the existing system's logframe a strict superset of the client's.

## Target structure

```
PDO (root)
├── ALIGNMENT (optional context branch)
│     └─ alignment indicators (youth unemployment, poverty)
│
├── OUTCOME_STATEMENT  (4 statements: jobs, talents, investment, climate)
│     └─ Outcome indicators
│
└── COMPONENT          (3 components: infra, talents, business env)
      └── OUTPUT_STATEMENT
            └─ Output indicators
                  └─ ACTIVITY (kept as a leaf; optional, project-defined)
```

## Schema changes

**Migration `1700000000010-LogframeHierarchyV2.ts`** — destructive to the CHECK constraint, additive otherwise:

```sql
ALTER TABLE logframe_nodes DROP CONSTRAINT logframe_nodes_type_check;
ALTER TABLE logframe_nodes ADD CONSTRAINT logframe_nodes_type_check
  CHECK (type IN ('pdo','alignment','component','outcome_statement',
                  'output_statement','outcome_indicator_group',
                  'goal','outcome','output','activity'));

-- Optional component-only columns (NULL for non-component nodes)
ALTER TABLE logframe_nodes
  ADD COLUMN budget_usd      NUMERIC,
  ADD COLUMN budget_currency VARCHAR(10) DEFAULT 'USD';

-- Project metadata (single-row table; supports start/end/midpoint dates)
CREATE TABLE project_meta (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name            VARCHAR(255) NOT NULL,
  sap_code        VARCHAR(50),
  pdo_text        TEXT NOT NULL,
  baseline_year   INTEGER NOT NULL,    -- 2022
  completion_year INTEGER NOT NULL,    -- 2028
  midpoint_date   DATE,                -- e.g. 2025-12-31
  pdo_node_id     UUID REFERENCES logframe_nodes(id),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

The legacy `goal/outcome/output/activity` values are kept in the CHECK so existing dev data does not break. Once Phase 10 seeds real data, an `1700000000099-DropLegacyLogframeTypes.ts` migration can remove them.

## Code changes

| File | Change |
|---|---|
| [logframe-node.entity.ts](ekz-server/src/logframe/logframe-node.entity.ts) | Add `budget_usd`, `budget_currency`. Widen `type` doc. |
| [logframe.service.ts:15-20](ekz-server/src/logframe/logframe.service.ts#L15-L20) | Replace `PARENT_TYPE_MAP` with the new rules below. Add a `validateAtMostOneOfType('pdo')` to enforce single-PDO. |
| `logframe/dto/create-node.dto.ts` | Update `@IsIn([...])` to the new enum. Add optional `budget_usd`, `budget_currency`. |
| [ekz/types/logframe.ts:3](ekz/types/logframe.ts#L3) | Update `LogframeLevel` union. |
| [ekz/components/logframe/LogframeTree.tsx](ekz/components/logframe/LogframeTree.tsx) | Render new node types (component nodes show budget chip; output statements collapse children). |
| `ekz/components/logframe/LogframeNodeForm.tsx` | New select options + conditional budget fields when type is `component`. |
| New: [ekz-server/src/project-meta/](ekz-server/src/project-meta/) | Module with one-row CRUD: `GET /api/project-meta`, `PUT /api/project-meta`. |
| Mocks | Add fixture PDO + 3 components + 4 outcome statements + 6 output statements (skeleton, no real titles yet). |

### New parent-type rules

```ts
const PARENT_TYPE_MAP: Record<string, string[] | null> = {
  pdo:                null,           // root only
  alignment:          ['pdo'],
  component:          ['pdo'],
  outcome_statement:  ['pdo'],
  output_statement:   ['component'],
  // legacy types — deprecated but still allowed
  goal:               null,
  outcome:            ['goal', 'pdo'],
  output:             ['outcome', 'output_statement'],
  activity:           ['output', 'output_statement'],
};
```

## Dependencies & risks

- **🚧 Blocks** Phase 2 (indicator level enum needs new node types referenced).
- **🟡 Risk:** Frontend logframe tree component currently assumes linear hierarchy; needs visual refresh to handle parallel branches under PDO. Mitigation: render OUTCOMES section + COMPONENTS section side-by-side instead of a single tree.

## DoD

- [ ] Migration applied locally; existing dev nodes preserved.
- [ ] Can create `pdo`, `component`, `output_statement` via Swagger.
- [ ] `validateParentConstraint` rejects cross-rule violations.
- [ ] Logframe tree page renders new types without runtime errors.
- [ ] At-most-one-PDO check enforced.
- [ ] Project-meta endpoint returns single-row config.

---

# Phase 2 — Indicator Metadata Extension

**Goal:** Bring the `indicators` table up to the Monitoring Plan column set: methodology, RMF/ADOA flag, target mode, data source type, expanded frequency, and composite-unique codes.

## Schema changes

**Migration `1700000000011-IndicatorAfdbMetadata.ts`:**

```sql
-- Drop UNIQUE on code; outcome 1.1 and output 1.1 must coexist
ALTER TABLE indicators DROP CONSTRAINT indicators_code_key;

-- Stronger discriminator: indicator kind
ALTER TABLE indicators
  ADD COLUMN kind VARCHAR(30) NOT NULL DEFAULT 'output'
    CHECK (kind IN ('alignment','outcome','output','activity'));

-- Composite unique within kind + project (one project = one logframe today)
CREATE UNIQUE INDEX indicators_code_kind_uniq ON indicators (code, kind);

-- New per-indicator metadata
ALTER TABLE indicators
  ADD COLUMN methodology         TEXT,
  ADD COLUMN rmf_adoa            BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN target_mode         VARCHAR(20) NOT NULL DEFAULT 'cumulative'
    CHECK (target_mode IN ('cumulative','incremental','binary')),
  ADD COLUMN data_source_type    VARCHAR(30) NOT NULL DEFAULT 'form_submission'
    CHECK (data_source_type IN (
      'form_submission','tracer_study','contractor_report',
      'financial_statement','policy_document','external_feed','manual'
    )),
  ADD COLUMN reporting_year_start INTEGER,   -- e.g. 2023 for indicators that start late
  ADD COLUMN reporting_year_end   INTEGER;   -- defaults to project.completion_year

-- Widen frequency enum
ALTER TABLE indicators DROP CONSTRAINT indicators_frequency_check;
ALTER TABLE indicators ADD CONSTRAINT indicators_frequency_check
  CHECK (frequency IN ('monthly','quarterly','bi_annually','annually','mid_term','one_off'));

-- Ensure level CHECK accepts the new vocabulary
ALTER TABLE indicators DROP CONSTRAINT indicators_level_check;
ALTER TABLE indicators ADD CONSTRAINT indicators_level_check
  CHECK (level IN ('alignment','impact','outcome','output','activity'));
```

`target_mode = 'binary'` covers Yes/No indicators (e.g. Output 6.2 *Innovation policy operationalised*).

## Code changes

| File | Change |
|---|---|
| [indicator.entity.ts](ekz-server/src/indicators/indicator.entity.ts) | Add `kind`, `methodology`, `rmf_adoa`, `target_mode`, `data_source_type`, `reporting_year_start/end`. Update `level` doc. |
| [indicators/dto/create-indicator.dto.ts](ekz-server/src/indicators/dto/create-indicator.dto.ts) | Add fields. Tighten `@IsIn` for `frequency` and `level`. |
| `indicators/dto/update-indicator.dto.ts` | Mirror. |
| [indicators.service.ts](ekz-server/src/indicators/indicators.service.ts) | `serialize()` exposes new fields; `findAll()` accepts `kind`, `rmf_adoa`, `data_source_type` filters. |
| [ekz/types/indicator.ts](ekz/types/indicator.ts) | Add types: `IndicatorKind`, `TargetMode`, `DataSourceType`. Extend `Indicator` interface. |
| [ekz/components/indicators/IndicatorForm.tsx](ekz/components/indicators/IndicatorForm.tsx) | Add inputs + conditional rendering (e.g. hide form-mapping for `external_feed`). |
| Mocks | Update `mocks/indicators.ts` factory. |

## Dependencies & risks

- **🚧 Depends on** Phase 1 (the `kind` field references the same vocabulary; node parent rules must already accept the new types).
- **🚧 Blocks** Phase 3 (multi-year targets), Phase 4 (disaggregation), Phase 7 (external feeds), Phase 9 (UI surfaces).
- **Data risk:** dropping `UNIQUE` on `code` is irreversible without dedup. There is no client data yet, so safe in dev.

## DoD

- [ ] Two indicators with same `code` but different `kind` can coexist.
- [ ] Listing supports `kind` and `rmf_adoa` filters.
- [ ] Indicator form persists methodology + flags round-trip.
- [ ] Frequencies `mid_term` and `one_off` accepted by `POST /indicators`.

---

# Phase 3 — Multi-Year Targets

**Goal:** Express Monitoring Plan year columns (2023/2026/2028, plus other years where applicable) as queryable data, and rewire status computation to be year-aware.

## Schema changes

**Migration `1700000000012-IndicatorYearTargets.ts`:**

```sql
CREATE TABLE indicator_year_targets (
  indicator_id UUID NOT NULL REFERENCES indicators(id) ON DELETE CASCADE,
  year         INTEGER NOT NULL,
  target_value NUMERIC NOT NULL,
  notes        TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (indicator_id, year)
);

CREATE INDEX indicator_year_targets_year_idx
  ON indicator_year_targets (year);
```

The pre-existing `indicators.target` column remains as the **completion target** (2028). `indicator_year_targets` carries milestones at 2023, 2026, etc. For `cumulative` indicators those are running totals; for `incremental` they are *that year's* slice.

## Helper: expected progress at a given date

New module: `ekz-server/src/indicators/helpers/expected-progress.ts`.

```ts
/**
 * Returns the value the indicator should have reached by `asOf`, given its
 * year targets and target_mode. Used by status computation, dashboards, and
 * the AfDB supervision report.
 */
export function expectedAt(
  indicator: { target_mode: TargetMode; target: number },
  yearTargets: IndicatorYearTarget[],   // sorted ascending by year
  asOf: Date,
): number;
```

Behaviour:
- `cumulative`: linear interpolation between the two surrounding milestones.
- `incremental`: sum of all year slices ≤ `asOf.year` plus a fraction of the current year's slice based on day-of-year.
- `binary`: 1 if `asOf` ≥ the target year, else 0.
- No year targets defined → fall back to current behaviour (`indicator.target` interpreted as completion).

## Code changes

| File | Change |
|---|---|
| [indicators/helpers/compute-status.ts](ekz-server/src/indicators/helpers/compute-status.ts) | Accept `expected` instead of `target`. Same 0.9 / 0.6 thresholds, but vs. `expected` not the lifetime target. |
| [indicators.service.ts](ekz-server/src/indicators/indicators.service.ts) | `addProgress` and `update` recompute status using `expectedAt(now)`. |
| New endpoint | `GET /api/indicators/:id/year-targets` and `PUT /api/indicators/:id/year-targets` (bulk replace). |
| [reports.service.ts](ekz-server/src/reports/reports.service.ts) | Each `IndicatorReportRow` gains `year_targets`, `expected_at_now`, `expected_at_completion`. |
| [dashboard.service.ts](ekz-server/src/dashboard/dashboard.service.ts) | Monthly trend rows compare actual vs `expected` rather than vs flat completion target. |
| Frontend | `IndicatorForm` adds a year-targets editor (rows: year, value); progress charts show milestone markers. |
| Mocks | Year-target fixture per indicator. |

## Dependencies & risks

- **🚧 Depends on** Phase 2 (`target_mode` column).
- **🚧 Blocks** Phase 8 (overdue scheduler must use `expectedAt` to be sensible) and Phase 9 (dashboards/reports).
- **Behavioural risk:** existing indicators without year targets must continue to work. Defensive fallback is required.

## DoD

- [ ] An indicator with three year targets returns the correct interpolated `expected_at` for any date.
- [ ] Status flips between on_track / at_risk / off_track when year-target milestones change.
- [ ] Dashboard graph shows actual vs expected line, not actual vs flat target.
- [ ] Removing all year targets gracefully reverts to legacy single-target behaviour.

---

# Phase 4 — Disaggregation as First-Class

**Goal:** Express “70% youth, 40% women” as machine-readable rules, capture per-progress breakdowns, and aggregate disaggregated counts in reports.

## Schema changes

**Migration `1700000000013-IndicatorDisaggregation.ts`:**

```sql
CREATE TABLE indicator_disaggregations (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  indicator_id UUID NOT NULL REFERENCES indicators(id) ON DELETE CASCADE,
  axis         VARCHAR(40) NOT NULL,         -- 'sex','age_band','cohort','skill_level','geography','university_origin'
  required     BOOLEAN NOT NULL DEFAULT true,
  -- breakdown_target is jsonb so axis-specific shapes can vary:
  --   sex:        { "female": 0.4 }                         (40% target)
  --   age_band:   { "youth": 0.7 }
  --   skill_level:{ "advanced": 0.1 }
  --   cohort:     { "affected_household": 500 }             (absolute, not ratio)
  breakdown_target JSONB,
  notes        TEXT,
  UNIQUE (indicator_id, axis)
);

CREATE TABLE indicator_progress_breakdowns (
  progress_id UUID NOT NULL REFERENCES indicator_progress(id) ON DELETE CASCADE,
  axis        VARCHAR(40) NOT NULL,
  -- value_breakdown jsonb: numeric splits matching the axis
  --   sex:        { "male": 1200, "female": 800 }
  --   age_band:   { "youth": 1400, "non_youth": 600 }
  value_breakdown JSONB NOT NULL,
  PRIMARY KEY (progress_id, axis)
);
```

## Code changes

| File | Change |
|---|---|
| `ekz-server/src/indicators/disaggregation.service.ts` *(new)* | CRUD on rules; aggregator that rolls all progress rows up by axis. |
| `indicators.controller.ts` | New routes: `GET/PUT /indicators/:id/disaggregation`, `GET /indicators/:id/disaggregation/rollup?axis=sex`. |
| `dto/create-progress.dto.ts` | Optional `breakdowns: { axis, value_breakdown }[]`. |
| `submissions.service.ts` `applyFieldMappings` | If a form has a beneficiary attribute mapping (sex, age, cohort), the auto-created progress entry also gets a breakdown row. |
| Frontend | Indicator detail page gains a "Disaggregation" tab (rules + rollup chart). |
| Frontend | Manual progress entry modal lets the user record `male/female`, `youth/non_youth`, etc. |
| Frontend types | `Disaggregation`, `Breakdown`. |
| Mocks | Disaggregation rules + sample breakdowns. |

## Dependencies & risks

- **🚧 Depends on** Phase 2.
- **🟡 Soft-dep on** Phase 5 — cohort axes only become useful once beneficiaries exist, but the schema can land first.
- **🚧 Blocks** Phase 9 (disaggregated charts in reports).

## DoD

- [ ] An indicator with a `sex` rule (40% female target) shows actual ratio and gap on its detail page.
- [ ] A progress entry submitted with `breakdowns: [{ axis: 'sex', value_breakdown: {male:60,female:40} }]` aggregates correctly.
- [ ] AfDB report preview shows disaggregated table per indicator.
- [ ] Backfill: indicators without rules behave exactly as before.

---

# Phase 5 — Beneficiary Registry & Cohorts

**Goal:** Track real people across the M&E lifecycle so that "70% youth, 40% women, 500 from affected HHs" is grounded in identifiable records, and Ago Araromi / Ijan-Ekiti compliance is auditable.

## Schema changes

**Migration `1700000000014-Beneficiaries.ts`:**

```sql
CREATE TABLE beneficiaries (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  full_name       VARCHAR(255) NOT NULL,
  sex             VARCHAR(10) NOT NULL CHECK (sex IN ('female','male','other','prefer_not')),
  date_of_birth   DATE,
  age_band        VARCHAR(20),                      -- 'under_18','18_24','25_34','35_plus' — derived but cached
  community       VARCHAR(255),
  household_id    VARCHAR(100),                      -- per state social registry, when applicable
  phone_e164      VARCHAR(20),
  national_id_hash VARCHAR(64),                       -- SHA-256 only, never raw
  skill_level     VARCHAR(40),
  notes           TEXT,
  consent_given   BOOLEAN NOT NULL DEFAULT false,
  consent_date    TIMESTAMPTZ,
  created_by      UUID NOT NULL REFERENCES users(id),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX beneficiaries_phone_idx ON beneficiaries (phone_e164);
CREATE INDEX beneficiaries_community_idx ON beneficiaries (community);

CREATE TABLE cohorts (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code        VARCHAR(64) UNIQUE NOT NULL,
  name        VARCHAR(255) NOT NULL,
  description TEXT,
  color       VARCHAR(20),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE beneficiary_cohorts (
  beneficiary_id UUID NOT NULL REFERENCES beneficiaries(id) ON DELETE CASCADE,
  cohort_id      UUID NOT NULL REFERENCES cohorts(id)       ON DELETE CASCADE,
  added_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (beneficiary_id, cohort_id)
);

-- Submissions can optionally reference a beneficiary
ALTER TABLE submissions
  ADD COLUMN beneficiary_id UUID REFERENCES beneficiaries(id);
```

## Code changes

| File | Change |
|---|---|
| New module: `ekz-server/src/beneficiaries/` | Entity, controller, service, DTOs. RBAC: only `admin` and `me_staff` see PII; `programme_staff` can register beneficiaries but only view their own entries. |
| New module: `ekz-server/src/cohorts/` | Simple CRUD for the cohort catalogue. Seeded by Phase 10 with the canonical cohorts decided in Phase 0. |
| Forms | New form field type `beneficiary_picker` (looks up by phone or NIN-hash; opens registration modal on miss). |
| `submissions.service.ts` | Validate `beneficiary_id` against form spec. When `applyFieldMappings` triggers, the auto-created `indicator_progress` row carries a default cohort breakdown sourced from beneficiary attributes. |
| Frontend | Beneficiary list page (admin/me_staff), registration form with consent toggle, cohort tagging UI. |
| Frontend | Officer data-entry: beneficiary autocomplete with offline fallback (Dexie-cached recent entries). |
| Audit | Every beneficiary read on a non-bulk endpoint logs `view` to a new `audit_pii_access` table (PII-grade audit). |
| Encryption | Add per-row symmetric encryption for `national_id_hash` source (out of scope: at-rest disk encryption — handled at infra layer). |

### PII handling rules (must be in `docs/decisions/0006-pii-policy.md`)

- Never store raw NIN or BVN — only `sha256(salt + raw)`.
- Never expose phone or NIN in list endpoints; only in single-record fetch with audit.
- Soft-delete only (set `active = false`) so the audit trail survives.
- Export to CSV/PDF strips contact fields unless explicit `include_pii=true` flag with admin role.

## Dependencies & risks

- **🚧 Depends on** Phase 0 (PII policy decision).
- **🟡 Soft-dep on** Phase 4 (cohort axis becomes meaningful with beneficiaries; can ship in parallel).
- **🚧 Blocks** real-data Phase 10 seeding for indicators that count people.
- **Risk:** PII increases regulatory scope (NDPR in Nigeria). Phase 0 must clear data-protection sign-off.

## DoD

- [ ] Officer can register a beneficiary offline; entry syncs via existing batch path.
- [ ] Cohort catalogue seeded with the canonical cohorts.
- [ ] Beneficiary list endpoint redacts PII without admin role.
- [ ] PII audit log records every single-record read.
- [ ] Submissions can be filed with or without `beneficiary_id` (officer training intake → with; building progress → without).

---

# Phase 6 — Document & Evidence Store

**Goal:** Capture the non-form Means-of-Verification documents (contractor supervision reports, RAP reports, fund manager portfolio, policy documents, financial statements). Each document is attached to either an indicator, an indicator-progress entry, or a project location.

## Schema changes

**Migration `1700000000015-EvidenceDocuments.ts`:**

```sql
CREATE TABLE evidence_documents (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title                 VARCHAR(500) NOT NULL,
  description           TEXT,
  document_type         VARCHAR(50) NOT NULL,        -- locked enum from Phase 0 decision
  reference_period_from DATE,
  reference_period_to   DATE,
  file_url              TEXT NOT NULL,
  file_size_bytes       BIGINT NOT NULL,
  mime_type             VARCHAR(100) NOT NULL,
  sha256                VARCHAR(64) NOT NULL,        -- for tamper detection
  uploaded_by           UUID NOT NULL REFERENCES users(id),
  uploaded_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  -- Polymorphic attachment (exactly one set, except both NULL = orphan/global)
  indicator_id          UUID REFERENCES indicators(id)         ON DELETE SET NULL,
  indicator_progress_id UUID REFERENCES indicator_progress(id) ON DELETE SET NULL,
  location_id           UUID REFERENCES project_locations(id)  ON DELETE SET NULL,
  CHECK (
    (CASE WHEN indicator_id          IS NOT NULL THEN 1 ELSE 0 END) +
    (CASE WHEN indicator_progress_id IS NOT NULL THEN 1 ELSE 0 END) +
    (CASE WHEN location_id           IS NOT NULL THEN 1 ELSE 0 END) <= 1
  )
);

CREATE INDEX evidence_documents_indicator_idx ON evidence_documents (indicator_id);
CREATE INDEX evidence_documents_progress_idx  ON evidence_documents (indicator_progress_id);
CREATE INDEX evidence_documents_type_period_idx
  ON evidence_documents (document_type, reference_period_to);
```

## Code changes

| File | Change |
|---|---|
| New module: `ekz-server/src/evidence/` | Controller + service. Uploads via Azure container `wiftdocuments` (separate from images). |
| `azure-storage.service.ts` | Add `uploadDocument(containerName, key, buffer, mime)` — reuses existing pattern; multipart accepted (not base64). |
| `uploads.controller.ts` | New route `POST /api/uploads/document` (multipart, `multer` 25 MB cap initially). |
| Frontend | Indicator detail page: new "Evidence" tab; lists docs, supports drag-drop upload, preview for PDFs/images. |
| Frontend | Submission detail page: same evidence panel for narrative attachments. |
| Reports service | Each `IndicatorReportRow` gains `evidence: { id, title, document_type, file_url }[]`. |

## Dependencies & risks

- **🚧 Depends on** Phase 2 (indicators have richer metadata) and Phase 0 (document-type enum locked).
- **Soft-dep on** the multipart upload work in [AUDIT_FINDINGS.md §3.2](AUDIT_FINDINGS.md). If we keep base64-only uploads, large PDFs (>500 KB) will fail.
- **Storage growth:** documents are bigger than photos. Lifecycle policy (cold tier after 90 days) should be enabled on the Azure container.

## DoD

- [ ] An M&E officer can attach a contractor supervision report PDF to Indicator 2.1 (Roads).
- [ ] AfDB report preview lists evidence for each indicator.
- [ ] Upload integrity: re-upload of same file produces matching sha256.
- [ ] Tamper test: changing the blob raises a "checksum mismatch" warning when next loaded.

---

# Phase 7 — External Data-Source Indicators

**Goal:** Cleanly model indicators whose values come from outside the system (Nigeria Bureau of Statistics, SPV financials, Fund Manager portfolio). They never auto-populate from form submissions; they must be edited by hand or fed via API token.

## Schema changes

None beyond Phase 2's `data_source_type` column. This phase is pure code/UX.

## Code changes

| File | Change |
|---|---|
| `indicators.controller.ts` | Block `field_mappings` from referencing indicators where `data_source_type IN ('external_feed','financial_statement','policy_document')` (validation-time, not migration-time). |
| `forms.service.ts` | Same validation when forms add mappings. |
| Frontend | Indicator detail page hides the "Linked Forms" panel for external-feed indicators; shows a banner "External source: Nigeria Bureau of Statistics — update manually." |
| Frontend | Manual progress entry remains; can attach a document of type `external_report` (Phase 6). |
| API token integration | Existing `JwtOrApiTokenGuard` may be reused once [AUDIT_FINDINGS.md §2.1](AUDIT_FINDINGS.md) is fixed: the API token role is currently rejected by `RolesGuard`. |

## Dependencies & risks

- **🚧 Depends on** Phase 2 (`data_source_type`).
- **🟡 Recommended** to first fix the API-token role issue from [AUDIT_FINDINGS.md §2.1](AUDIT_FINDINGS.md) so external integrations actually work.

## DoD

- [ ] Cannot attach a form mapping to an `external_feed` indicator (400 error with clear message).
- [ ] Indicator detail UI distinguishes form-driven vs manual vs external-feed visually.
- [ ] API-token route can append progress to an `external_feed` indicator.

---

# Phase 8 — Frequency & Scheduler Updates

**Goal:** Make the existing daily 08:00 cron understand `mid_term` and `one_off`, and use Phase 3's `expectedAt` to fire smarter overdue alerts.

## Code changes

| File | Change |
|---|---|
| [scheduler.service.ts:33-38](ekz-server/src/scheduler/scheduler.service.ts#L33-L38) | Replace day-threshold map with rule-aware logic. |
| New helper: `scheduler/helpers/overdue.ts` | `isOverdue(indicator, lastProgressDate, projectMeta, now): boolean`. |

### Rules

- `monthly | quarterly | bi_annually | annually`: same as today (days-since threshold).
- `mid_term`: overdue if `now > project_meta.midpoint_date AND no progress entry recorded in the period [midpoint - 90 days, midpoint + 90 days]`. Fires once.
- `one_off`: overdue if `now > project_meta.completion_year-12-31 AND no progress entry ever`. No reminders before completion year.
- All frequencies: also fire `at_risk` alert when `actual / expectedAt(now) < 0.6`, using Phase 3's helper.

## Dependencies & risks

- **🚧 Depends on** Phase 3 (`expectedAt`) and Phase 2 (frequency CHECK widened) and Phase 1 (project-meta table for midpoint date).
- **Behavioural risk:** an indicator that was previously alerting on calendar gaps may stop alerting if its year-target line is on track. Document this clearly in release notes.

## DoD

- [ ] Mid-term indicator with no progress at midpoint+1 day fires exactly one alert per recipient.
- [ ] One-off indicator never fires before completion year.
- [ ] Annually indicator that is mathematically on-track but 366 days since last entry still fires the calendar alert (defence in depth).

---

# Phase 9 — Dashboard, Reports, & Frontend Surfaces

**Goal:** Render everything the previous phases enabled. The output is what the AfDB supervision team actually sees.

## Surfaces to build / refactor

### 9.1 Dashboard (executive)
- KPI strip: Total indicators, On track / At risk / Off track (now defined as actual vs expected, not actual vs lifetime target).
- Component cards: per-component progress %, budget consumed (when we wire a budget-tracking source), alert count.
- RMF/ADOA toggle: filter to only Bank-rollup indicators.
- Map widget keeps its current behaviour but pins now respect `data_source_type` (no pin for external feeds).

### 9.2 Logframe page
- New visual: PDO at top, two columns underneath (Outcome statements | Components).
- Components are accordion-collapsible to their output statements; output statements expand to indicators.
- Indicators show: name, code, kind, `expectedAt(now)` vs current value, RMF check.

### 9.3 Indicator detail page (`/indicators/[id]`)
- Tabs: Overview · Year Targets · Disaggregation · Linked Forms · Manual Progress · Evidence · Audit.
- Year Targets tab: editable table per year; chart with milestones.
- Disaggregation tab: rules + per-axis rollup chart, gender/age/cohort.
- Evidence tab: documents from Phase 6.

### 9.4 Reports — AfDB twice-yearly supervision template
- Cover page from `project_meta`.
- Executive summary KPIs (existing) + RMF rollup.
- Per-component sections; per-output statement; per-indicator with year-target trajectory and disaggregation rollup.
- Evidence index (last page) with document titles, dates, links.
- Generated server-side as PDF (resolves the [AUDIT_FINDINGS.md §4.4](AUDIT_FINDINGS.md) `download_url='#'` issue).

### 9.5 Forms builder updates
- New field type chips: `beneficiary_picker`, `cohort_select`.
- Field mappings panel disables itself for external-feed indicators (Phase 7).
- Visual marker on form list when a form is the canonical source for an RMF/ADOA indicator.

## Code changes — high-level

| Path | What happens |
|---|---|
| `ekz-server/src/reports/templates/afdb-supervision.ts` *(new)* | Server-side PDF templating (e.g. PDFKit). |
| `ekz-server/src/reports/reports.service.ts` | New `generatePdf()` that writes to Azure documents container and updates `download_url`. |
| `ekz/components/dashboard/*` | Component cards, RMF toggle. |
| `ekz/components/logframe/LogframeTwoColumn.tsx` *(new)* | Replaces `LogframeTree.tsx` for the AfDB layout. |
| `ekz/app/(dashboard)/indicators/[id]/page.tsx` | Tabs scaffold. |
| `ekz/app/(dashboard)/reports/page.tsx` | Connect to new server-rendered PDF flow. |

## Dependencies & risks

- **🚧 Depends on** all previous phases.
- **Risk:** Recharts performance with the new disaggregated charts on indicator detail. Spike a load test with ~20 progress entries × 4 axes early in this phase.

## DoD

- [ ] AfDB supervision PDF is generated server-side and downloadable from the reports list.
- [ ] Logframe page shows the parallel outcome/component layout the client docs imply.
- [ ] Indicator detail page renders all six tabs and is keyboard-accessible (WCAG 2.1 AA).
- [ ] Dashboard component cards reflect Phase 1 budget data when present.

---

# Phase 9.5 — Quarterly Progress Report (QPR) Template

**Inserted 2026-05-12** after a gap analysis comparing the Phase 9 supervision PDF against the client's preferred submission format (see `Client-Update/request.pdf`). The Phase 9 PDF covers the M&E results-framework portion well, but the AfDB Quarterly Project Progress Report template is a much broader submission document mixing M&E with risks, AWP status, compliance trackers, procurement, and financial disbursement.

**Goal:** Reshape the server-rendered PDF to match the QPR template's section structure (sections A · B · C · Annexes 1–5) and close the **M&E-adjacent** data-model gaps so EKDIPA can submit the document to AfDB without manual rework in Word. **Procurement (C.3, Annexes 2–4) and Financial disbursement (C.4, Annex 5) stay out of scope** — those domains are ERP territory (SAP Ariba / Bank SAP) and duplicating them inside the M&E system creates two sources of truth. They render as **structured placeholders** with explicit "Owned by [Procurement Unit | Finance Unit]" labels and pre-allocated fields the team can fill before submission.

**Why not absorb into Phase 9 or defer to Phase 11:** Phase 9 was scoped as "render what previous phases enabled" — the QPR domain introduces new entities (risks, covenants, AWP quarterly status, narratives), not just rendering. Deferring past Phase 10 (seeding) would mean re-seeding once these tables exist; cheaper to close the data model first.

## Schema changes

Migration `1700000000016-QprDomain.ts`.

| Change | Purpose |
|---|---|
| **ALTER** `project_meta` — add `sector` varchar(100), `country` varchar(100) (default `'Nigeria'`), `executing_agency` varchar(255), `responsible_project_staff` varchar(255), `original_disbursement_deadline` date, `revised_disbursement_deadline` date | Cover-page widening for QPR section A.1 |
| **NEW** `project_financing_sources` — id uuid PK, source_name varchar(255), instrument varchar(50) CHECK in (`'loan'`, `'grant'`, `'cofinancing'`, `'counterpart'`), total_approved_ua numeric(18,2), disbursed_ua numeric(18,2), order int, project_meta_id uuid FK → project_meta | A.1 financing-source/instrument table — one row per source |
| **NEW** `project_risks` — id uuid PK, key_issue text, corrective_action text, responsibility varchar(255), deadline date, status varchar(20) CHECK in (`'pending_initiation'`, `'in_progress'`, `'finalized'`), comments text, created_at, updated_at, soft-delete via `resolved_at` timestamptz nullable | A.3 issues, challenges, risks, actions |
| **NEW** `quarterly_progress_reports` — id uuid PK, year int, quarter int (1–4), executive_summary text, pdo_assessment text, unanticipated_results jsonb (`[{ category: 'gender'\|'climate'\|'civil_society'\|'private_sector'\|'hiv_aids'\|'other', text: string }]`), bank_performance_assessment text, borrower_performance_assessment text, cofinancier_performance_assessment text, pmt_status text, awp_planned_next_qtr text, generated_at timestamptz, generated_by varchar(255), created_at, updated_at; UNIQUE `(year, quarter)` | A.2 / B.1 / B.4 / C.5 / PMT — narrative fields keyed per quarter. UPSERT semantics so each quarter persists exactly one record. |
| **NEW** `activity_quarterly_status` — id uuid PK, logframe_node_id uuid FK → logframe_nodes (validated at service layer to be `type='activity'`), year int, quarter int (1–4), status varchar(20) CHECK in (`'pending_initiation'`, `'in_progress'`, `'finalized'`, `'cancelled'`), pct_achievement int (0–100), comments text, planned_for_next_qtr boolean, deadline date, created_at, updated_at; UNIQUE `(logframe_node_id, year, quarter)` | C.2.1 / C.2.2 — per-activity per-quarter AWP status workflow |
| **ALTER** `indicator_year_targets` — add `is_original` boolean default true, `revision_year` int nullable; backfill all existing rows to `is_original=true`, `revision_year=null` | Annex 1 — separates PAR-original projections from impl-updated revisions. Editing a year target inserts a new revision row (preserving original) rather than overwriting. |
| **NEW** `project_covenants` — id uuid PK, covenant_text text, type varchar(50) CHECK in (`'entry_into_force'`, `'first_disbursement'`, `'undertaking'`), status varchar(20), comments text, order int, created_at, updated_at | C.1.1 — Bank covenants compliance |
| **NEW** `safeguard_measures` — id uuid PK, type varchar(20) CHECK in (`'esmp'`, `'rap'`, `'other'`), measure_name varchar(255), total_count int, not_started_count int, ongoing_count int, completed_count int, budget_allocated_ua numeric(18,2), amount_disbursed_ua numeric(18,2), order int, created_at, updated_at | C.1.2 — environmental & social safeguards rollup |
| **NEW** `audit_findings` — id uuid PK, year int, audit_status varchar(20) CHECK in (`'pending_initiation'`, `'in_progress'`, `'finalized'`), key_issue text, corrective_measures text, comments text, expected_submission_date date, order int, created_at, updated_at | C.1.3 — outstanding audits + financial-audit findings |

All ALTERs are additive — no column drops, no CHECK widening that breaks existing data. The `indicator_year_targets` backfill is the only data-touching step; `is_original=true` for every pre-Phase-9.5 row is the safe default (treat all existing entries as PAR-originals until someone revises).

## Code changes

### Backend

| Path | Change |
|---|---|
| `src/project-meta/project-meta.entity.ts` + DTO | Add the six new columns; `upsert()` updates them. |
| `src/project-meta/financing-sources/` *(new sub-module)* | Service + controller for `GET/POST/PUT/DELETE /api/project-meta/financing-sources`. |
| `src/project-risks/` *(new module)* | Standard CRUD module. `@Roles(ADMIN, ME_STAFF)`. List endpoint accepts `?status=` filter. |
| `src/quarterly-reports/` *(new module)* | Controller routes: `GET /api/quarterly-reports?year=&quarter=`, `PUT /api/quarterly-reports/:year/:quarter` (UPSERT). |
| `src/awp-status/` *(new module)* | `GET /api/awp-status?year=&quarter=` returns activities + their status; `PUT /api/awp-status/:nodeId/:year/:quarter` upserts a single row. Service-layer assertion that the referenced node has `type='activity'`. |
| `src/compliance/` *(new module)* | Three services + one controller umbrella: `CovenantsService`, `SafeguardsService`, `AuditFindingsService`. Routes: `/api/compliance/covenants`, `/api/compliance/safeguards`, `/api/compliance/audit-findings`. Kept under one module so admin imports stay cohesive. |
| `src/indicators/indicators.service.ts` | `setYearTargets()` no longer destructively replaces. Edit semantics: new row with `is_original=false`, `revision_year=<current year>`, preserving the latest-by-(year, is_original) lookup. `getYearTargets()` returns both originals and revisions sorted by year then by revision_year. New helper `getLatestYearTargets()` for the dashboard / expectedAt callers (returns the latest revision per year). |
| `src/reports/templates/afdb-qpr.ts` *(new)* | New canonical QPR template. Section order matches request.pdf: cover (A.1) → A.2 → A.3 → B.1 → B.2 → B.3 → B.4 → C.1.1 → C.1.2 → C.1.3 → C.2.1 → C.2.2 → **placeholder block for C.3** → **placeholder block for C.4** → C.5 → Annex 1 → **placeholder blocks for Annexes 2–5**. Placeholder blocks render a labelled panel: section title, "Owned by [Procurement Unit / Finance Unit]", and a fixed-row table the team fills outside the system. |
| `src/reports/templates/afdb-supervision.ts` | **Keep for one release cycle** as a deprecated alias re-exporting `renderAfdbQprPdf`. Drop in Phase 10 cleanup. |
| `src/reports/reports.service.ts` | Rename `getSupervisionData()` → `getQprData(year, quarter, generatedBy)`. Returned shape extends previous with: `cover` (widened), `risks`, `narratives` (the quarterly_progress_reports row for that period), `awp_status` (activities × current quarter + next quarter), `compliance.{covenants, safeguards, audit_findings}`, `annex1` (per-output year-by-year original/updated/actual matrix). `generate()` accepts `year` + `quarter` in the DTO; defaults to current. |
| `src/reports/reports.controller.ts` | `POST /api/reports/generate` DTO gains `year?` + `quarter?`. Swagger updated. |
| `src/reports/dto/generate-report.dto.ts` | Add the two fields. |
| `src/database/migrations/1700000000016-QprDomain.ts` | The migration above. Round-trip via `dist/data-source.js` per tooling_quirks. |

### Frontend

| Path | Change |
|---|---|
| `app/(dashboard)/admin/project-meta/page.tsx` | Add sector, country, executing agency, responsible staff, disbursement deadlines. Financing-source table editor (add/edit/remove rows). |
| `app/(dashboard)/admin/risks/page.tsx` *(new)* | Risks CRUD. Status chips, deadline date picker, soft-delete via "Resolve". |
| `app/(dashboard)/admin/compliance/page.tsx` *(new)* | Tabbed surface — Covenants · Safeguards · Audit Findings. Reuses the Tabs primitive from F-Slice 6. Each tab is a small CRUD table. |
| `app/(dashboard)/admin/quarterly-narratives/page.tsx` *(new)* | Year + quarter selector at top. Below: the seven narrative fields (Exec Summary, PDO Assessment, Unanticipated Results × N categories, Bank Performance, Borrower Performance, Co-financier Performance, PMT Status, AWP Planned Next Quarter). Replaces the Narrative editor removed in Phase 9 F-Slice 12. |
| `app/(dashboard)/admin/awp/page.tsx` *(new)* | Year + quarter selector; table of activity nodes (filterable by component) with status / % achievement / planned-for-next-qtr / comments. |
| `app/(dashboard)/reports/page.tsx` | Add Year + Quarter selectors above the existing format / date range. Generate button POSTs `year + quarter`. PDF preview is removed (the live PDF link from the reports list is the source of truth now). |
| `lib/services/` *(new files)* | `risks.ts`, `quarterlyReports.ts`, `awpStatus.ts`, `compliance.ts`. |
| `types/` *(new files)* | `risk.ts`, `quarterlyReport.ts`, `awpStatus.ts`, `compliance.ts`. |
| `components/admin/` | Small reusable sub-components for risks/safeguards/covenants tables. |
| `mocks/handlers.ts` + new `mocks/qpr.ts` | MSW handlers for all six new endpoints + fixtures (1 quarterly_progress_report for current quarter, 3-5 risks, 4-6 covenants, 2 safeguard groups, 1 audit finding). |
| `components/layout/Sidebar` | Add the four new admin entries (Risks, Compliance, AWP, Quarterly Narratives) under an "Admin / Reporting" section. |

## Dependencies & risks

- **Depends on** Phase 1 (project_meta), Phase 3 (year_targets), Phase 9 (PDF infrastructure + Tabs primitive).
- **Risk — year-target edit semantics.** Changing `setYearTargets()` from destructive-replace to revision-insert is a behaviour change. The frontend YearTargetsCard must be updated to render "original (PAR)" vs "latest revision" distinctly, and the expectedAt helper must read the *latest revision* per year (not the original). Mitigation: introduce `getLatestYearTargets()` and have all existing read-paths swap to it.
- **Risk — quarterly-report concurrent edits.** Single-admin workflow expected; v1 last-write-wins. Optimistic locking via `updated_at` is a future hardening.
- **Risk — placeholder sections (C.3, C.4, Annexes 2–5)** may invite confusion ("why is this empty?"). Mitigation: render explicit "Owned by [team]" labels in the panel and a one-line description of what the team should fill in.
- **Risk — sidebar grows large.** Four new admin entries on top of the existing eight. Group under a collapsible "Reporting / Compliance" section.

## DoD

- [ ] `pnpm seed` (Phase 10) plus a fresh QPR generation produces a PDF whose section order exactly matches `Client-Update/request.pdf` (A.1, A.2, A.3, B.1, B.2, B.3, B.4, C.1.1, C.1.2, C.1.3, C.2.1, C.2.2, [placeholder C.3], [placeholder C.4], C.5, Annex 1, [placeholders Annexes 2–5]).
- [ ] Admin can populate every M&E-adjacent field via dashboard forms (no backend tools required).
- [ ] Re-running `POST /api/reports/generate` for the same `(year, quarter)` updates the narrative row in place rather than creating duplicate reports metadata.
- [ ] Editing an indicator's year targets preserves the original PAR values; the trajectory chart reflects the latest revision but the Annex 1 Output-Projections table shows Original vs Updated vs Actual.
- [ ] Placeholder sections C.3, C.4, Annex 2–5 render with explicit ownership labels (no fields blank or misleading).
- [ ] Sidebar adds a "Reporting" section grouping the four new admin pages; keyboard-navigable.
- [ ] Backend test suite grows by ~10 new spec cases (QPR shape contract, AWP node-type guard, year-target revision math). Lint baseline preserved.
- [ ] MSW handlers cover the six new endpoints; dev mode works against fixtures.

## Slice plan (high-level)

Two PRs, like Phase 9.

**Backend (~6 slices):**
1. Migration `1700000000016-QprDomain` + entities + project_meta widening DTO.
2. ProjectFinancingSources + ProjectRisks + ProjectCovenants modules.
3. SafeguardMeasures + AuditFindings + AwpQuarterlyStatus modules.
4. QuarterlyProgressReports module + indicators year-target revision refactor (`getLatestYearTargets`).
5. `afdb-qpr.ts` template + `getQprData()` rewrite + reports controller DTO + spec.
6. Test spec coverage + boot smoke + AUDIT_FINDINGS annotation if any items close.

**Frontend (~6 slices):**
1. Types + services + MSW handlers.
2. project-meta page widening.
3. Risks admin page.
4. Compliance admin page (three tabs).
5. Quarterly Narratives admin page + AWP admin page.
6. Reports page period selector + sidebar regrouping.

---

# Phase 10 — Seeding (preview, not in this plan's scope)

This is sketched only so the structure phases above can be designed with seeding in mind. **Note:** Phase 9.5 widens `project_meta` and introduces new tables (risks, covenants, safeguards, etc.); the seed order below was updated 2026-05-12 to reflect the new shape.

**Inputs:**
- The reconciled targets from Phase 0 decisions.
- The cohort catalogue from Phase 0.
- The Monitoring Plan + Results Framework as the source of truth for codes, names, units, methodologies.
- The QPR-specific seed values (executing agency = "EKDIPA", country = "Nigeria", financing sources from PAR, etc.) for the Phase-9.5-widened `project_meta` columns.

**Order of operations:**
1. `project_meta` row with **all Phase-9.5 fields populated** — name, sap_code, sector, country='Nigeria', executing_agency='EKDIPA', responsible_project_staff, pdo_text, baseline_year=2024, completion_year=2028, midpoint_date=2026-06-30, original_disbursement_deadline, revised_disbursement_deadline.
2. `project_financing_sources` rows (one per AfDB financing instrument + counterpart funding).
3. PDO logframe node.
4. 4 outcome-statement nodes; 3 component nodes; 6 output-statement nodes; activity nodes per AWP.
5. Cohort catalogue (already in the Phase-5 migration — seed is idempotent re-run).
6. ~9 outcome indicators + ~24 output indicators + 2 alignment indicators.
7. Year-target rows per indicator (2023, 2026, 2028 + interpolated). **All seeded with `is_original=true`** to establish the PAR baseline; subsequent revisions are entered through the admin UI.
8. Disaggregation rules per indicator (sex, age, cohort where applicable).
9. Project locations (Ago Araromi, Ijan-Ekiti, Ado-Ekiti zone, university hubs).
10. `project_covenants` from the loan/grant agreement.
11. `safeguard_measures` skeletons (ESMP / RAP categories with zero-status until the first quarterly review).
12. (Optional) skeleton forms for the questionnaires the client confirms are needed.

**Tooling:** Either extend `ekz-server/src/database/seeds/seed.ts` with structured fixtures (TS modules per group) or build a `scripts/import-results-framework.ts` that ingests an authoritative spreadsheet and emits SQL. Recommend the latter — the client will revise targets before completion, and a re-runnable importer is cheaper than re-editing fixtures.

**DoD:** A fresh DB + `pnpm seed` produces:
- The exact AfDB structure shown in [Client-Update/RESULTS FRAMEWORK FOR EKZ.pdf](Client-Update/RESULTS%20FRAMEWORK%20FOR%20EKZ.pdf) (logframe + indicators + year-targets + disaggregation rules).
- A fully populated `project_meta` cover (Phase 9.5 fields included) so the QPR PDF cover page renders end-to-end with no placeholder text.
- `GET /api/reports/preview` returning sensible numbers for every indicator with the correct expected-vs-actual lines.
- `POST /api/reports/generate` for the current quarter producing a QPR PDF whose section A.1 cover, B.1 PDO, B.2 outcome, B.3 output, and Annex 1 output projections all render without manual data entry. Admin UI is still required for narratives, risks, AWP status, etc — those aren't seeded.

---

# Cross-Cutting Tracks (run in parallel)

These are independent of the phase sequence; they should be scheduled by capacity, not waited on.

## Track A — Security & Auth Hardening
Source: [AUDIT_FINDINGS.md §1, §2](AUDIT_FINDINGS.md). Specifically:
1. Rotate every credential in [ekz-server/.env](ekz-server/.env) and scrub git history. **Do this first.**
2. Replace the unsigned `ekz-auth` cookie with a server-set HttpOnly cookie or verify JWTs in middleware.
3. Fix `'api_token'` role mismatch ([AUDIT_FINDINGS.md §2.1](AUDIT_FINDINGS.md)) — Phase 7 needs this to function.
4. Token-prefix indexed lookup ([§2.2](AUDIT_FINDINGS.md)).

This track must complete **before** the system is exposed to real client data, but can run in parallel with Phases 1–4 in dev.

## Track B — Test Coverage Foundation
Source: [AUDIT_FINDINGS.md §6](AUDIT_FINDINGS.md). Add tests for:
- `applyGeofence` (current).
- `computeStatus` and the new `expectedAt` (Phase 3).
- `applyFieldMappings` (current; gets richer in Phase 4).
- Auth flow E2E (login → me → change-password).

Without this, Phase 3's status semantics will silently rot.

## Track C — Migrations Off Boot
Source: [AUDIT_FINDINGS.md §4.1](AUDIT_FINDINGS.md). Move from `migrationsRun: true` to a deploy-time step. Phases 1–7 all add migrations; the more we ship, the more painful boot-time failures become.

## Track D — Frontend Mocks Parity
MSW handlers in [ekz/mocks/](ekz/mocks/) must track every backend change. Each phase's DoD includes an MSW update so dev mode never falls behind real API. Failing this, the demo path breaks every two weeks.

## Track E — Documentation
- Update [CLAUDE.md](CLAUDE.md) at the end of each phase.
- Maintain `docs/decisions/` (ADRs) for every irreversible choice.
- Keep [AUDIT_FINDINGS.md](AUDIT_FINDINGS.md) honest — close items as they are fixed.

---

# Phase Dependency Graph

```
                      ┌──────────────────────────────────┐
                      │ Phase 0  Reconciliation & locks  │
                      └──────────────────────────────────┘
                             │ blocks everything below
        ┌────────────────────┼────────────────────┐
        ▼                    ▼                    ▼
 ┌─────────────┐      ┌─────────────┐      ┌─────────────┐
 │ Track A     │      │ Track B     │      │ Track C     │
 │ Security    │      │ Tests       │      │ Migrations  │
 │ (parallel)  │      │ (parallel)  │      │ off boot    │
 └─────────────┘      └─────────────┘      └─────────────┘
                             │
                             ▼
                      ┌─────────────┐
                      │ Phase 1     │
                      │ Hierarchy   │
                      └─────────────┘
                             │
                             ▼
                      ┌─────────────┐
                      │ Phase 2     │
                      │ Indicator   │
                      │ metadata    │
                      └─────────────┘
                             │
              ┌──────────────┼──────────────┐
              ▼              ▼              ▼
       ┌────────────┐ ┌────────────┐ ┌────────────┐
       │ Phase 3    │ │ Phase 4    │ │ Phase 7    │
       │ Year       │ │ Disaggreg- │ │ External   │
       │ targets    │ │ ation      │ │ feeds      │
       └────────────┘ └────────────┘ └────────────┘
              │              │
              │              │     ┌────────────┐
              │              └────►│ Phase 5    │
              │                    │ Beneficia- │
              │                    │ ries       │
              │                    └────────────┘
              │                            │
              │                            ▼
              │                    ┌────────────┐
              │                    │ Phase 6    │
              │                    │ Evidence   │
              │                    │ documents  │
              │                    └────────────┘
              ▼
       ┌────────────┐
       │ Phase 8    │
       │ Scheduler  │
       └────────────┘
              │
              ▼
       ┌──────────────────────┐
       │ Phase 9              │
       │ Dashboard / Reports  │
       │ / UI surfaces        │
       └──────────────────────┘
              │
              ▼
       ┌──────────────────────┐
       │ Phase 9.5            │
       │ QPR template         │
       │ + narratives + risks │
       │ + compliance + AWP   │
       └──────────────────────┘
              │
              ▼
       ┌────────────┐
       │ Phase 10   │
       │ Seed real  │
       │ data       │
       └────────────┘
```

---

# Suggested Sequencing & Sizing

A realistic schedule, assuming one full-stack engineer plus part-time client liaison:

| # | Phase | Calendar | Notes |
|---|---|---|---|
| 0 | Reconciliation | 1–2 weeks (mostly client) | Engineering reviews drafts; client signs off. |
| A | Security rotation | Day 1 | Blocking for any prod exposure. |
| 1 | Hierarchy | 1 week | Schema + UI tree refresh. |
| 2 | Indicator metadata | 1 week | Schema + DTO + form. |
| 3 | Year targets | 1.5 weeks | Math + helper + UI editor. Highest risk of regression. |
| 4 | Disaggregation | 1.5 weeks | Schema + rollup + UI tabs. |
| 5 | Beneficiaries | 2 weeks | PII + offline workflow. |
| 6 | Evidence docs | 1 week | Storage extension + UI. |
| 7 | External feeds | 0.5 weeks | Mostly UX. Depends on Track A item 3. |
| 8 | Scheduler | 0.5 weeks | Self-contained. |
| 9 | Dashboard/reports | 2.5 weeks | The biggest UI work; PDF templating non-trivial. |
| 9.5 | QPR template | 1.5 weeks | Inserted 2026-05-12 after client gap analysis. Migration + 5 new modules + 4 new admin pages + PDF rewrite. Procurement (C.3) and Financial disbursement (C.4) stay placeholders. |
| 10 | Seeding | 1 week | Re-runnable importer + verification report. Updated to populate Phase 9.5 fields. |
|   | **Total** | **~14.5–15.5 weeks of engineering** | Plus Phase 0's calendar gate. |

This is structure-first. Phases 1–4 unlock the schema; Phases 5–7 unlock the data sources; Phase 9 unlocks the deliverables AfDB will see; Phase 9.5 reshapes the deliverable to match the client's submission template. Real seed data follows last, when there is finally a place to put it.

---

# Open Questions (must close before each phase)

| # | Phase | Question |
|---|---|---|
| Q1 | 0 | Which document wins on each conflicting target? (RF or Monitoring Plan) |
| Q2 | 0 | Are alignment indicators (youth unemployment, poverty) tracked in-system or context-only? |
| Q3 | 0 | Project midpoint date — fixed or computed? |
| Q4 | 0 | Document-type enum — final list? |
| Q5 | 0 | What beneficiary attributes is the client legally able to collect? Is NIN allowed? |
| Q6 | 1 | Should `outcome_statement` and `component` ever share an indicator (cross-link)? Default answer: no — but worth confirming. |
| Q7 | 3 | When a year target is missing for an interim year, do we linearly interpolate (proposed) or treat the milestone as "no expectation" (more conservative)? |
| Q8 | 4 | Do output indicators that count things (e.g. roads-km) need disaggregation at all? Default: only `kind = outcome` indicators get disaggregation rules by default. |
| Q9 | 5 | Where does the social-registry lookup come from for the "household livelihoods affected" cohort tagging? Manual at registration, or imported list? |
| Q10 | 6 | Maximum document size? Retention period? Cold-tier policy? |
| Q11 | 9 | What is the AfDB report template the client expects? Do we have a sample to copy? |

---

# What this plan does NOT cover

- **Authentication overhaul** beyond what AUDIT_FINDINGS.md flags. JWT-as-cookie is the minimum bar; full SSO/OIDC is its own initiative.
- **Mobile app.** The current PWA is the mobile experience. A native wrapper is a separate decision.
- **Offline-first for evidence documents.** Phase 6 assumes documents are uploaded online (M&E staff at HQ, not field officers). Confirm with client; if field officers need to attach contractor reports offline, scope expands.
- **Real-time collaboration.** Two M&E officers editing the same indicator simultaneously is currently last-write-wins. If that's not acceptable, optimistic locking is a separate item.
- **PostGIS adoption.** Geofence is O(n) Haversine in JS today. Acceptable until ~1k locations. Tracked in [AUDIT_FINDINGS.md §3.1](AUDIT_FINDINGS.md).

---

**End of plan.** Next action: circulate Phase 0 reconciliation memo to the client and lock the six decisions before any code is written.
