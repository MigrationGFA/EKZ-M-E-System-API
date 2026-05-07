# ADR 0006 — PII Handling Policy for the Beneficiary Registry

**Status:** Proposed (industry-standard default; pending client confirmation + Data Protection Officer sign-off)
**Date:** 2026-05-07
**Phase:** 0 — Reconciliation & Locked Decisions
**Decider:** Engineering (default); to be confirmed by EKDIPA Data Protection Officer + AfDB Safeguards Officer

---

## Context

Phase 5 of [IMPLEMENTATION_PLAN.md](../../IMPLEMENTATION_PLAN.md) introduces the `beneficiaries` table and a cohort registry. This is the first time the system stores Personally Identifiable Information (PII) at scale: real names, dates of birth, communities, optional phone numbers and government IDs.

The applicable legal/policy frameworks are:

- **Nigeria Data Protection Regulation (NDPR) 2019** + **Nigeria Data Protection Act (NDPA) 2023** — the binding national regulation.
- **AfDB Operational Safeguards** — particularly OS2 (Labour & Working Conditions) and OS5 (Land Acquisition & Involuntary Displacement), both of which require named beneficiary tracking with consent.
- **AfDB Disclosure and Access to Information Policy** — sets the access ceiling.

The Bank, the State, and the Operator (EKDIPA) are all data controllers / processors at different points; the system is the data store.

## Decision

### Allowed to collect — with explicit consent (`consent_given = true`, `consent_date` recorded)

| Field | Notes |
|---|---|
| `full_name` | Required. |
| `sex` | One of `female`, `male`, `other`, `prefer_not`. |
| `date_of_birth` | Optional. If declined, `age_band` (e.g. `18_24`) must be set instead. |
| `community` | Settlement name. |
| `household_id` | Optional; from Ekiti State social registry where applicable. |
| `phone_e164` | Optional. Format: E.164 (`+234…`). Indexed but redacted in list views. |
| `skill_level` | Free-form taxonomy (`basic` / `intermediate` / `advanced` for ICT skills initially). |
| `disability_status` | Optional. Self-declared. Used to populate the `pwd` cohort. |
| `notes` | Free-text, M&E officer use only. **Must not** contain new PII categories without an explicit consent flag. |
| Beneficiary photo | Optional. Stored as a separate `evidence_documents` row of type `photo_evidence`, with `consent_for_photo` flagged. |

### Allowed to collect — with **explicit consent + audited access**

| Field | Storage rule |
|---|---|
| `national_id_hash` | Compute `SHA-256(server_secret || raw_NIN)`. Store hash only. **Never store raw NIN.** Used for duplicate detection and authoritative match-back to NIMC, never for display. |

### Never collected

| Category | Why |
|---|---|
| Bank Verification Number (BVN) | Outside the M&E system's mandate; storage triggers banking-data regulations beyond NDPA. |
| Account numbers | Compensation payments are processed by EKDIPA finance, not this system. |
| Health / medical records | Sensitive personal data under NDPA s.30; out of scope. |
| Religious affiliation | Sensitive personal data; not relevant to project outcomes. |
| Political views | Sensitive personal data; never relevant. |
| Ethnicity | Sensitive personal data; not requested by the client. |
| Marital status | Not requested; risk of inferred discrimination. |
| Raw NIN (plaintext) | Storage of raw national ID in non-NIMC systems is restricted. We hash; we never persist plaintext. |

### Consent

- Consent is **explicit and recorded**: `consent_given BOOLEAN NOT NULL DEFAULT false`, `consent_date TIMESTAMPTZ`, `consent_method VARCHAR(50)` (one of `paper_signature`, `digital_signature`, `verbal_recorded`, `sms_opt_in`).
- A beneficiary record without consent is permitted **only** in two cases:
  1. **Aggregate-only entries** (e.g. "30 youth attended this hackathon" — no individual identification).
  2. **Court-ordered or audit-mandated retention** of a record whose consent was revoked (extremely rare; flagged in code).
- Consent **withdrawal** triggers anonymisation: the row is updated with `full_name = '[withdrawn]'`, `phone_e164 = NULL`, `national_id_hash = NULL`, `withdrawn_at` set. Cohort tags and aggregate counts survive; the record is no longer identifiable.
- Consent must be **renewed** if the system collects new categories (e.g. if `disability_status` is added later, every existing record needs a fresh consent flag for that category).

### Storage rules

1. **Soft delete only.** Beneficiary rows are never hard-deleted (audit trail must survive). Hard delete is reserved for testing / GDPR-equivalent right-to-erasure if asserted via a formal NDPR request — and even then, only after written authorisation logged in audit.
2. **Field-level treatment for sensitive columns.** `phone_e164` and `national_id_hash` are excluded from default `SELECT *` projections via service-layer filtering. List endpoints redact these unconditionally; single-record fetches require an audited reason.
3. **At-rest encryption** is provided by infrastructure (PostgreSQL TDE or block-device encryption). Application-layer encryption of specific columns is **not** implemented in v1; revisit when storage moves out of EKDIPA-controlled infrastructure.
4. **Backups** containing PII have the same retention rules as the live data (see below). Backups exported to lower environments must be sanitised: real names replaced with synthetic ones, phones zeroed, NIN hashes replaced with random fixed-length strings.

### Access control (RBAC, layered on existing roles)

| Role | List beneficiaries | Read single record | Write | Read PII columns | Export with PII |
|---|---|---|---|---|---|
| `admin` | Yes | Yes (audited) | Yes | Yes | Yes (audited, with reason) |
| `me_staff` | Yes (PII redacted) | Yes (audited) | Yes (with consent) | Yes (single-record only) | Yes (audited, with reason) |
| `programme_staff` | Own registrations only | Own registrations only | Yes (register new) | No | No |
| `viewer` | Aggregates only | Aggregates only | No | No | No |

**Audited PII access** means: every single-record fetch by a user, and every export with `include_pii=true`, writes a row to a dedicated `pii_access_log` table:

```sql
CREATE TABLE pii_access_log (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL REFERENCES users(id),
  user_email      VARCHAR(255) NOT NULL,
  beneficiary_id  UUID REFERENCES beneficiaries(id),
  action          VARCHAR(30) NOT NULL,    -- 'view','export','update','withdraw'
  reason          TEXT,                    -- required for export; optional for view
  request_id      VARCHAR(40),             -- correlation ID to the HTTP request
  ip_address      INET,
  user_agent      TEXT,
  accessed_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX pii_access_log_beneficiary_idx ON pii_access_log (beneficiary_id);
CREATE INDEX pii_access_log_user_idx        ON pii_access_log (user_id);
CREATE INDEX pii_access_log_accessed_idx    ON pii_access_log (accessed_at);
```

This table is immutable once written (no UPDATE / DELETE permitted in production roles); audited access reports filter from it.

### Retention

| Phase | Rule |
|---|---|
| Project active (now → 2028-12-31) | Retain identifiable. |
| Post-completion (2029-01-01 → 2033-12-31) | Retain identifiable for 5 years (AfDB safeguards window for resettled persons; standard for tracer follow-up). |
| Post-2034 | Anonymise: replace `full_name` with cohort-tagged pseudonym (`Beneficiary #<seq>`), drop `phone_e164` and `national_id_hash`, retain `sex` / `age_band` / `community` / cohort tags / training/jobs participation history for statistical continuity. |
| At any time on consent withdrawal | Anonymise as above. |

Retention deadlines are computed per record from `created_at + retention_offset` and surfaced in an admin "due for anonymisation" report. Anonymisation is operator-triggered (one-button bulk action with confirmation) — not auto-applied — so EKDIPA can document the action.

### Export rules

- All exports default to `include_pii=false`. PII columns are blanked or replaced with the anonymised pseudonym.
- `include_pii=true` requires:
  - `admin` or `me_staff` role
  - A non-empty `reason` argument (logged to `pii_access_log`)
  - Export filename includes `[PII]` prefix (visual flag)
- AfDB report PDFs (Phase 9) **never** contain raw PII; they contain aggregate cohort counts only. Single-record drill-down is in-app only.

## Rationale

1. **NDPR / NDPA 2023 require explicit, recorded consent for processing personal data.** The Act mandates: lawful basis, purpose limitation, data minimisation, accuracy, storage limitation, integrity & confidentiality, and accountability. Our policy maps onto these:
   - Lawful basis: consent.
   - Purpose limitation: M&E reporting only; field uses cannot bleed into commercial uses.
   - Minimisation: we collect what the project needs; nothing more.
   - Storage limitation: 5-year post-completion + anonymise.
   - Integrity: SHA-256 for IDs, audit trail.

2. **AfDB OS5 (Involuntary Displacement) requires named beneficiary tracking** for resettlement. The Ago Araromi / Ijan-Ekiti affected populations must be individually identifiable to demonstrate compensation reached the right people — but their identifiers are sensitive precisely because compensation is involved.

3. **Hashed-only NIN is a standard pattern** used by Nigerian fintechs, government registries, and AfDB-funded operations elsewhere. It supports duplicate-detection (the same person doesn't get counted twice in the 8,000 youth target) without retaining a key that, if leaked, exposes the individual to identity theft.

4. **No BVN.** Banking-grade identifiers are out of scope. Collecting them imposes Central Bank of Nigeria reporting obligations beyond the M&E mandate.

5. **PII access log as a separate immutable table** is required by NDPR's accountability principle and matches the practice in any data-protection-mature organisation. The general `audit_log` is for resource changes; the PII log is for *reads*, which the general audit doesn't cover.

6. **Programme staff see only their own registrations.** Field officers in remote locations should be able to register beneficiaries offline (per the Phase 5 sync flow), but their access shouldn't fan out across the whole registry. M&E staff at HQ have the broader view.

7. **Export defaults are PII-off.** This is the single most important friction point: PII leaks via exports are the most common breach pattern. Defaulting to redacted means the system asks for explicit intent before producing identifiable data.

8. **Anonymisation is operator-triggered, not automatic.** A surprise nightly cron that anonymises records would violate audit expectations. EKDIPA needs to *decide* to anonymise — and that decision is itself logged.

## What we are NOT doing

- Not implementing per-row column-level encryption with HSM-backed keys. At-rest is left to infra; we'll revisit if the deployment moves to multi-tenant cloud or if a regulator demands it.
- Not implementing automated NDPR Subject Access Request (SAR) workflows in v1. SARs are handled manually by EKDIPA's DPO; the system supports the manual export.
- Not deploying client-side end-to-end encryption. The PWA model is server-trusted.
- Not capturing biometrics (fingerprints, facial templates). NIMC operates the national biometric registry; we don't replicate.
- Not classifying beneficiary photos as biometric data — they're treated as `photo_evidence` documents with consent. (NDPA's biometric classification applies to processed templates, not raw photos.)
- Not exporting to free-text CSV from list views — only structured per-record reports.

## Revisit if

- NDPR / NDPA enforcement guidance from the National Data Protection Commission introduces new obligations.
- AfDB issues a project-specific safeguards instruction.
- A formal Data Protection Impact Assessment (DPIA) recommends additional controls.
- A breach occurs (mandatory revisit; informs hardening).
- The system is exposed to additional roles (e.g. external auditors) — fresh access matrix needed.
- A future module collects financial transactions or health data — those bring additional regimes.

## References

- *Nigeria Data Protection Regulation (NDPR) 2019* — Sections on consent, sensitive data, lawful processing
- *Nigeria Data Protection Act (NDPA) 2023* — Sections 24 (lawful basis), 25 (consent), 30 (sensitive personal data), 32 (data subject rights), 35 (records of processing)
- *AfDB Operational Safeguards* — OS2 (Labour & Working Conditions), OS5 (Involuntary Displacement)
- *NIMC Regulations* on NIN handling — hashing-only requirement for non-NIMC systems
- *ISO/IEC 27701* — privacy information management baseline
- *NDPR Implementation Framework 2020* — practical guidance on consent records
