# ADR 0003 — Beneficiary Cohort Catalogue

**Status:** Proposed (industry-standard default; pending client confirmation)
**Date:** 2026-05-07
**Phase:** 0 — Reconciliation & Locked Decisions
**Decider:** Engineering (default); to be confirmed by EKDIPA M&E focal point + Safeguards Officer

---

## Context

The client documents reference several beneficiary subgroups whose tracking is contractually required:

- **Ago Araromi** and **Ijan-Ekiti** communities, whose livelihoods were affected by EKZ land demarcation (intro paragraph + Output 6.5 Resettlement Compensation).
- **Youth (70%)** and **Women (40%)** as proportional targets across job-creation outcomes.
- **"500 youth from HHs with affected livelihoods"** as a sub-target of Output 4.1.
- **"At least 10% of target trained in advanced level skills"** within Output 4.1.
- **"High-potential young women and men selected from poorest and vulnerable households in the State social registry"** for Output 3.3 device provision.
- **"Female-led startups"** as a focus of Output 5.2 capacity building.

Phase 4 (Disaggregation) and Phase 5 (Beneficiary Registry) of [IMPLEMENTATION_PLAN.md](../../IMPLEMENTATION_PLAN.md) require a stable cohort catalogue before they can land.

## Decision

**Pre-seed the `cohorts` table with the following 12 cohort codes.** Codes are stable identifiers used in queries, disaggregation rules, and exports. Display names are revisable.

| # | Code | Display Name | Definition | Source |
|---|---|---|---|---|
| 1 | `ekz_affected_ago_araromi` | Ago Araromi (affected) | Households in Ago Araromi community whose livelihoods were affected by EKZ land demarcation. | Project intro paragraph; AfDB safeguards |
| 2 | `ekz_affected_ijan_ekiti` | Ijan-Ekiti (affected) | Households in Ijan-Ekiti community whose livelihoods were affected by EKZ land demarcation. | Project intro paragraph; AfDB safeguards |
| 3 | `ekz_affected_resettled` | EKZ Resettlement Beneficiary | Roll-up of #1 and #2; receives RAP compensation under Output 6.5. | RF Output 6.5 |
| 4 | `youth` | Youth (18–35) | Per Nigerian National Youth Policy (2019). Used for the 70% youth target. | National Youth Policy 2019; AfDB Jobs for Youth in Africa Strategy |
| 5 | `woman` | Woman | Female beneficiaries. Used for the 40% women target. | RF Outcome 1 disaggregation |
| 6 | `female_led_startup` | Female-led Startup | Startup with female founder, CEO, or majority female leadership team. | RF Output 5.2 |
| 7 | `affected_household_youth` | Youth from Affected Household | Subset of `youth` whose household is in `ekz_affected_resettled`. The 500-youth target in Output 4.1. | RF Output 4.1 |
| 8 | `advanced_skill_trainee` | Advanced ICT Skill Trainee | Beneficiaries trained at advanced level (per the 10% target in Output 4.1). | RF Output 4.1 |
| 9 | `vulnerable_household` | Vulnerable Household | From Ekiti State social registry's poorest-and-vulnerable pool. | RF Output 3.3 |
| 10 | `pwd` | Person Living with Disability | Standard cross-cutting cohort per AfDB safeguards, even where not named in the RF. | AfDB Operational Safeguard 2 |
| 11 | `ago_araromi_resident` | Ago Araromi Resident (non-affected) | Resident of Ago Araromi but not in the resettlement-affected pool. Optional analytical cohort. | Project geography |
| 12 | `ijan_ekiti_resident` | Ijan-Ekiti Resident (non-affected) | Resident of Ijan-Ekiti but not in the resettlement-affected pool. Optional analytical cohort. | Project geography |

### Cohort membership rules

- A beneficiary may belong to multiple cohorts simultaneously (M:N via `beneficiary_cohorts`).
- Cohort `ekz_affected_resettled` is a **derived rollup**: any beneficiary in `ekz_affected_ago_araromi` or `ekz_affected_ijan_ekiti` is automatically in `ekz_affected_resettled`. Implemented as a database trigger or a service-layer auto-tag.
- Cohort `affected_household_youth` is **derived**: a beneficiary in `youth` AND `ekz_affected_resettled` is auto-tagged into this cohort.
- `youth` membership is computed from `date_of_birth` at the time of registration: `age_at_intake BETWEEN 18 AND 35`. Re-evaluated nightly only if DoB is updated; otherwise sticky.

### Disaggregation axes that reference cohorts

The Phase 4 disaggregation rules use cohorts on the following axes:

- `cohort` — generic cohort breakdown (used by the AfDB report).
- `affected_status` — binary cohort `ekz_affected_resettled` vs not.
- `gender_target` — uses cohort `woman`.
- `age_target` — uses cohort `youth`.

## Rationale

1. **Mandatory cohorts come straight from the RF.** Ago Araromi, Ijan-Ekiti, and the resettled rollup are non-negotiable — they are named in the project's safeguards documentation and in Output 6.5.

2. **Demographic cohorts (youth, women) reflect proportional targets the AfDB will measure.** The 70% youth / 40% women splits in Outcomes 1.1 and 1.2 cannot be evaluated without these cohorts.

3. **Sub-target cohorts** (`affected_household_youth`, `advanced_skill_trainee`) exist because the RF specifies counts that nest inside larger groups (500 of the 8,000 trained; 10% of the 8,000 in advanced skills). Modelling them as cohorts means the queries are clean.

4. **`pwd` (persons with disability) is added even though it is not in the client docs.** AfDB Operational Safeguard 2 (Labour and Working Conditions) and the Bank's Disability Inclusion Strategy (2022) treat disability inclusion as cross-cutting. Including the cohort from day one is cheap; bolting it on after the registry has tens of thousands of records is not.

5. **Resident cohorts (`ago_araromi_resident`, `ijan_ekiti_resident`) are optional but useful.** They let analysts compare affected vs non-affected residents in the same community without polluting the affected-only cohort.

6. **Derived cohorts (`ekz_affected_resettled`, `affected_household_youth`) prevent drift.** If we let users tag affected status manually on each cohort, we will eventually have beneficiaries in the youth+affected pool but not in `affected_household_youth`. Auto-tagging at the service layer or via trigger keeps the rollup honest.

7. **Codes are snake_case with project namespacing where ambiguous.** `ekz_affected_*` makes ownership obvious; `youth` and `woman` are intentionally generic so they can be reused if the system ever hosts a second project.

## What we are NOT doing

- Not modelling religion, ethnicity, or marital status. Out of scope, sensitive, and not requested.
- Not collecting income brackets directly — vulnerability is inferred via `vulnerable_household` membership in the state social registry, not a per-beneficiary income field.
- Not adding `senior_citizen` or `child` cohorts — the project is youth-focused, no age extremes are tracked.
- Not building cohort-specific permissions in v1. All staff who can read beneficiaries can read cohort tags. PII restrictions remain at the row level (see ADR 0006).

## Revisit if

- AfDB issues a project-specific gender or disability target requiring new cohorts (e.g. "30% of ICT trainees must be women aged 18–24").
- A new affected community is identified (e.g. boundary expansion).
- The client requests demographic categories we excluded (religion, ethnicity, etc.).
- A second project is onboarded — codes may need a project prefix system.

## References

- AfDB *Operational Safeguard 2* — Labour and Working Conditions
- AfDB *Disability Inclusion Strategy* (2022)
- AfDB *Jobs for Youth in Africa Strategy* (2016–2025) — youth definition
- Nigerian *National Youth Policy* (2019) — youth = 18–35
- Ekiti State Social Registry — vulnerable household identification methodology
