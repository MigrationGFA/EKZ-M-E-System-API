# ADR 0005 — Evidence Document Type Enum

**Status:** Proposed (industry-standard default; pending client confirmation)
**Date:** 2026-05-07
**Phase:** 0 — Reconciliation & Locked Decisions
**Decider:** Engineering (default); to be confirmed by EKDIPA M&E focal point

---

## Context

Phase 6 of [IMPLEMENTATION_PLAN.md](../../IMPLEMENTATION_PLAN.md) introduces the `evidence_documents` table. The Means-of-Verification (MoV) column of the Monitoring Plan references many document classes that the system must accept and categorise:

- Bureau-of-Statistics reports (Labour Force Survey, Poverty Report)
- Contractor contracts and supervision reports
- Third-party engineering supervision reports
- SPV business registration data and annual financial statements
- Fund Manager portfolio reports
- EKDIPA project monitoring reports (quarterly / annual)
- Approved plans (waste mgmt, climate, innovation, RAP)
- MOUs (university alliances)
- Tracer studies
- Roadshow reports
- Hub Management company annual reports
- Policy documents

Document type drives report sectioning, retention rules, and per-type validation (e.g. financial statements must declare a reference period; MOUs must declare counterparties).

## Decision

Lock the `evidence_documents.document_type` column to the following 18-value enum:

```sql
ALTER TABLE evidence_documents ADD CONSTRAINT evidence_documents_type_check
  CHECK (document_type IN (
    'contractor_supervision_report',
    'contractor_progress_report',
    'third_party_monitoring_report',
    'financial_statement',
    'fund_portfolio_report',
    'beneficiary_tracer_study',
    'beneficiary_assessment',
    'policy_document',
    'mou',
    'incubation_report',
    'roadshow_report',
    'rap_implementation_report',
    'ekdipa_quarterly_report',
    'ekdipa_annual_report',
    'external_data_extract',
    'photo_evidence',
    'audit_report',
    'other'
  ));
```

### Per-type metadata requirements

| Document type | Required fields beyond title/file |
|---|---|
| `contractor_supervision_report` | `reference_period_from`, `reference_period_to`, `contractor_name` *(custom field)* |
| `contractor_progress_report` | `reference_period_from`, `reference_period_to`, `contractor_name` |
| `third_party_monitoring_report` | `reference_period_from`, `reference_period_to`, `consultant_name` |
| `financial_statement` | `reference_period_from`, `reference_period_to`, `audited` (bool), `currency` |
| `fund_portfolio_report` | `reference_period_from`, `reference_period_to`, `fund_manager_name` |
| `beneficiary_tracer_study` | `reference_period_from`, `reference_period_to`, `cohort_id` (FK), `sample_size` |
| `beneficiary_assessment` | `reference_period_from`, `reference_period_to`, `methodology` |
| `policy_document` | `policy_status` (`draft`/`approved`/`operationalised`), `approval_date` |
| `mou` | `counterparty_name`, `effective_date`, `expiry_date` (nullable) |
| `incubation_report` | `reference_period_from`, `reference_period_to`, `centre_id` (FK to project_locations) |
| `roadshow_report` | `event_date`, `location` (text), `attendee_count` |
| `rap_implementation_report` | `reference_period_from`, `reference_period_to` |
| `ekdipa_quarterly_report` | `reference_period_from`, `reference_period_to`, `quarter_label` |
| `ekdipa_annual_report` | `reporting_year` |
| `external_data_extract` | `source_name`, `extract_date` |
| `photo_evidence` | (no extras; geotag optional) |
| `audit_report` | `reporting_year`, `auditor_name`, `audit_scope` |
| `other` | `description` is required (must explain why this didn't fit the enum) |

The shared columns (`title`, `description`, `file_url`, `mime_type`, `size_bytes`, `sha256`, `uploaded_by`, `uploaded_at`, polymorphic attachment FKs) are declared in the Phase 6 migration; the per-type extras are stored in a polymorphic JSONB column `type_metadata`.

### Document-class lifecycle defaults

| Type | Default retention (post-upload) | Default access |
|---|---|---|
| `financial_statement`, `audit_report` | 10 years (statutory minimum) | admin, me_staff |
| `rap_implementation_report` | 10 years (AfDB safeguards) | admin, me_staff |
| `policy_document`, `mou` | Indefinite | admin, me_staff, programme_staff (read) |
| `*_supervision_report`, `*_monitoring_report` | 7 years | admin, me_staff |
| `tracer_study`, `assessment` | 7 years | admin, me_staff |
| `external_data_extract` | 5 years | admin, me_staff, viewer (read) |
| `photo_evidence` | 5 years | admin, me_staff, programme_staff (read on own) |
| Everything else | 5 years | admin, me_staff |

These defaults can be overridden per-document via a `retention_until` field. The retention scheduler (out of scope until later) is informed by these defaults.

### Upload size & format constraints

- **Photo evidence:** max 10 MB; `image/jpeg`, `image/png`, `image/webp`, `image/heic`.
- **All other types:** max 50 MB; `application/pdf`, `image/*`, `application/vnd.openxmlformats-officedocument.*`, `text/csv`, `application/zip` (for collections of source files).
- All uploads compute SHA-256 server-side for tamper detection. Re-upload of a file with mismatched checksum prompts a confirmation modal.

### Polymorphic attachment

A document may be attached to **at most one** of: indicator, indicator_progress entry, or project_location. An "orphan" document (no attachment) is permitted for project-wide records (e.g. EKDIPA annual report covering the whole project).

## Rationale

1. **The 18-value enum mirrors every distinct MoV named in the client documents** plus three universally-needed AfDB document classes (`audit_report`, `external_data_extract`, `photo_evidence`) that are not explicit in the RF/MP but will be required in any AfDB-grade reporting context.

2. **Per-type metadata is stored as a typed JSONB column rather than separate tables.** Rationale:
   - Keeps queries simple (`WHERE document_type = X AND type_metadata->>'reporting_year' = '2026'`).
   - Avoids 18 sparse tables.
   - Frontend renders a per-type form by switching on `document_type`.
   - Validation done server-side via Zod / class-validator schemas keyed by type.

3. **Retention defaults follow standard development-finance practice.** AfDB and the World Bank both require RAP records to be retained for 10 years post-completion. Audit reports follow Nigerian statutory minimums. Photo evidence and routine reports use a shorter 5–7 year window because their per-record value decays.

4. **Polymorphic attachment is constrained to "at most one" target** to prevent ambiguous reporting. A contractor supervision report that covers multiple indicators is uploaded once with `indicator_id = NULL` and listed in the global archive; per-indicator pages then reference it by tag, not by FK.

5. **`other` is permitted but requires `description`.** This is a release valve for genuinely novel document types without polluting the enum with one-off values. If `other` appears more than ~3 times for the same effective document class, that's a signal to add a new enum value via a migration.

6. **Pre-attached extras like `cohort_id` for tracer studies** mean the AfDB report can answer "which tracer studies cover the affected-household youth cohort?" without parsing free text.

## What we are NOT doing

- Not building a full document management system (versions, branches, comments, e-signature). A future module can layer on; v1 is upload + categorise + retrieve.
- Not implementing OCR or full-text search on PDFs. Out of scope; can be added with `pgvector`/Azure AI Search later.
- Not implementing automated retention deletion in v1. The retention column is recorded; cleanup is a manual admin action with audit.
- Not encrypting document blobs at the application layer. At-rest encryption is provided by Azure Storage (server-side encryption with Microsoft-managed keys); per-blob encryption with project keys is a future hardening step.
- Not validating the contents of documents (e.g. checking that a "financial_statement" actually contains a balance sheet). Categorisation is operator-trusted.

## Revisit if

- The client identifies a recurrent document class that doesn't fit the enum (most likely candidate: `procurement_record`).
- A regulatory body (NDPR, AfDB) issues new retention rules.
- File-size or format limits constrain a real workflow (e.g. video walk-throughs of construction sites).
- Document version history becomes a contractual requirement.

## References

- AfDB *Disclosure and Access to Information Policy* — document classification practice
- AfDB *Procurement Framework for Bank-Group-Funded Operations* — required document trail
- World Bank *Document Records Management* policy — comparable taxonomy
- Nigerian *Public Procurement Act 2007* — statutory retention for procurement records
- ISO 15489-1 — Records Management foundation principles
