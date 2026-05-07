# ADR 0004 — Frequency Enum and Reporting Cadence

**Status:** Proposed (industry-standard default; pending client confirmation)
**Date:** 2026-05-07
**Phase:** 0 — Reconciliation & Locked Decisions
**Decider:** Engineering (default); to be confirmed by EKDIPA M&E focal point + AfDB Task Manager

---

## Context

The current schema constrains `indicators.frequency` to `monthly | quarterly | bi_annually | annually`. The Monitoring Plan introduces `Mid-term` (e.g. for Indirect Jobs and ICT youth tracer studies) and uses `Annually` ambiguously to mean different reporting deadlines. The scheduler at [scheduler.service.ts](../../ekz-server/src/scheduler/scheduler.service.ts) needs to know:

1. What frequencies exist.
2. What "overdue" means for each — a calendar threshold, a project milestone, or no schedule at all.
3. What the project's anchor dates are (start, midpoint, completion).

These all need to lock before the Phase 8 scheduler refactor.

## Decision

### Frequency enum (locked)

```sql
ALTER TABLE indicators ADD CONSTRAINT indicators_frequency_check
  CHECK (frequency IN (
    'monthly',
    'quarterly',
    'bi_annually',
    'annually',
    'mid_term',
    'one_off'
  ));
```

| Value | Meaning | Overdue rule |
|---|---|---|
| `monthly` | Reported once per calendar month | No progress entry in trailing 30 days → overdue |
| `quarterly` | Reported once per calendar quarter | No progress entry in trailing 90 days → overdue |
| `bi_annually` | Reported twice yearly, aligned to AfDB supervision (March / September) | No progress entry in trailing 180 days → overdue |
| `annually` | Reported once per calendar year (deadline 31 Dec) | No progress entry in trailing 365 days → overdue |
| `mid_term` | Single one-off study/survey at project midpoint | Overdue if `now > midpoint_date + 90 days` and no progress entry in the window `[midpoint − 90 days, midpoint + 90 days]`. Fires once. |
| `one_off` | Single deliverable at any point in the project | Never alerts before `completion_date`. After completion: overdue if no progress entry exists. |

### Project anchor dates (locked)

| Anchor | Value | Source |
|---|---|---|
| `baseline_year` | **2022** | RF "Baseline (2022)" column |
| `baseline_date` | **2022-01-01** | Convention: start of baseline year |
| `completion_year` | **2028** | RF "Target At Completion (2028)" |
| `completion_date` | **2028-12-31** | Convention: end of completion year |
| `midpoint_date` | **2025-06-30** | Chronological midpoint of 2022-01-01 → 2028-12-31 |

Stored in the new `project_meta` table introduced in Phase 1.

### Reporting deadlines (used for "due soon" UI hints, not enforced)

| Frequency | Deadline within each cycle |
|---|---|
| `monthly` | Last day of the month |
| `quarterly` | Last day of the quarter (Mar 31 / Jun 30 / Sep 30 / Dec 31) |
| `bi_annually` | **March 31 (H2 of prior year)** and **September 30 (H1 of current year)** — aligned to AfDB twice-yearly supervisions |
| `annually` | **December 31** of each year |
| `mid_term` | **2025-06-30** (one-off, ±90-day window) |
| `one_off` | **2028-12-31** (no recurring deadline) |

### Indicator → frequency mapping (default — applies to Phase 10 seeding)

Inferred from the Monitoring Plan column "Frequency of reporting":

| Indicator | Frequency in MP | Locked frequency |
|---|---|---|
| Outcome 1.1 Direct jobs | annual | `annually` |
| Outcome 1.2 Indirect jobs | Mid-term | `mid_term` |
| Outcome 2.1 ICT youth | Mid Term | `mid_term` |
| Outcome 2.2 Tech businesses | Annually | `annually` |
| Outcome 3.1 Firms | Annually | `annually` |
| Outcome 3.2 Operating revenue | Annually | `annually` |
| Outcome 3.3 Additional financing | Annually | `annually` |
| Outcome 4.1 GHG savings | annually | `annually` |
| Outcome 4.2 Climate measures | Annually | `annually` |
| Output 1.1 Data centre | Annually | `annually` |
| Output 1.2 Buildings | Annually | `annually` |
| Output 1.3 Fiber optic | Annually | `annually` |
| Output 2.1–2.6 Utilities | Annually | `annually` |
| Output 3.1 Centres of excellence | Annually | `annually` |
| Output 3.2 University alliances | Annually | `annually` |
| Output 3.3 Devices | Annually | `annually` |
| Output 3.4 Innovation labs | Annually | `annually` |
| Output 4.1 Youth trained | Annually | `annually` |
| Output 4.2 Hackathons | Annually | `annually` |
| Output 5.1 EIF | Annually | `one_off` *(set up once)* |
| Output 5.2 Capacity building | Annually | `annually` |
| Output 5.3 Pre-seed startups | Annually | `annually` |
| Output 6.1 SPV | Annually | `one_off` *(operationalised once)* |
| Output 6.2 Innovation policy | Annually | `one_off` *(developed once; after that, `annually` reviews)* |
| Output 6.3 Climate policy | Annually | `one_off` |
| Output 6.4 Roadshows | (blank) | `annually` *(one per year per ADR 0001)* |
| Output 6.5 Resettlement compensation | Annually | `one_off` *(paid in full)* |
| Alignment: Youth unemployment | NBS | `annually` |
| Alignment: Poverty rate | NBS | `annually` |

### Bi-annual mapping for AfDB supervision

The AfDB supervises EKZ twice yearly (per project intro paragraph). No indicator in the current RF/MP is explicitly `bi_annually`. The frequency is reserved for future use — e.g. risk-register entries, safeguards monitoring — and remains in the enum.

## Rationale

1. **`mid_term` is needed because the Monitoring Plan uses it explicitly** for tracer studies (Outcomes 1.2, 2.1, 2.2). These are not periodic; they are single point-in-time studies executed near the project midpoint. Modelling them as `annually` would generate spurious overdue alerts every year, then go quiet after the study lands.

2. **`one_off` is needed for binary deliverables.** Output 6.1 (SPV operationalised), Output 6.2/6.3 (policies developed), Output 5.1 (EIF set up) — these happen exactly once. They have no annual cadence. `annually` would fire alerts forever after the deliverable is complete.

3. **Midpoint date computed chronologically is AfDB standard.** Mid-term review missions are typically scheduled at year 3 of a 6-year project — exactly the midpoint. The `±90-day window` around the midpoint accommodates real-world scheduling slippage.

4. **The bi-annual deadlines (March 31 / September 30) align with AfDB supervision missions.** Most operations files cycle on these dates; using the same anchor avoids a separate supervision calendar.

5. **Annual deadline on December 31** matches calendar-year accounting for AfDB and Nigerian government reporting.

6. **Why not finer-grained frequencies (e.g. "weekly", "ad_hoc")?**
   - `weekly` is uncommon in M&E; field collection cycles are usually monthly minimum.
   - `ad_hoc` would map to `one_off` for tracking purposes and is therefore redundant.

## What we are NOT doing

- Not changing the existing `monthly | quarterly | bi_annually | annually` semantics.
- Not making midpoint date computed-from-record. It is stored in `project_meta` and edited by an admin, so a project amendment that shifts the timeline can be reflected.
- Not modelling per-indicator custom deadlines (e.g. "this indicator is reported on the 15th of every month"). Out of scope.
- Not implementing supervision-mission scheduling beyond the bi-annual deadline anchor.
- Not migrating existing data — the legacy values stay valid; new values are added.

## Revisit if

- AfDB issues a project amendment changing the start, midpoint, or completion dates.
- The client adds an indicator with a frequency genuinely not covered (e.g. a daily monitoring point).
- A new reporting deadline (e.g. quarterly progress note to the State Government) becomes binding.

## References

- AfDB *Project Cycle Procedures* — supervision frequency
- AfDB *Mid-Term Review Guidance Note* — midpoint conventions
- IFAD *RIMS Handbook* — equivalent frequency taxonomy (offers `mid_term` and `one_off` as standard values)
- World Bank *ISR (Implementation Status Report)* schedule — twice-yearly anchor
