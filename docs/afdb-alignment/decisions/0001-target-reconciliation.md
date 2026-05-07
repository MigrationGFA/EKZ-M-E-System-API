# ADR 0001 — Target Reconciliation: Results Framework vs Monitoring Plan

**Status:** Proposed (industry-standard default; pending client confirmation)
**Date:** 2026-05-07
**Phase:** 0 — Reconciliation & Locked Decisions
**Decider:** Engineering (default); to be confirmed by EKDIPA M&E focal point + AfDB supervision

---

## Context

The two client documents disagree on roughly ten end-of-project (2028) targets:

- [Client-Update/RESULTS FRAMEWORK FOR EKZ.pdf](../../Client-Update/RESULTS%20FRAMEWORK%20FOR%20EKZ.pdf) (the **Results Framework** / RF) is the contractual logframe annexed to the AfDB project documents, with single 2028 completion targets.
- [Client-Update/EKZ Monitoring plan.pdf](../../Client-Update/EKZ%20Monitoring%20plan.pdf) (the **Monitoring Plan** / MP) is the operational annex, with year columns 2023 / 2026 / 2028.

We must seed one canonical number per indicator per year. Conflicts must be resolved before schema and seed data land.

## Decision

**The Results Framework wins on completion targets. The Monitoring Plan is the source for interim milestones (2023, 2026). Where they conflict on a 2028 figure, the RF prevails.**

### Resolved completion targets (2028)

| Indicator | RF | MP | **Decision** | Note |
|---|---|---|---|---|
| Outcome 1.1 — Direct jobs | 7,007 | 49,045 | **7,007** | MP value treated as typo; the MP's own 30%-mid milestone of 2,102.1 = 30% × 7,007 confirms the RF figure. |
| Outcome 1.2 — Indirect jobs | 18,935 | 13,245 | **18,935** | MP's 30%-mid of 5,681 = 30% × 18,936 confirms RF. The MP 2028 value is internally inconsistent. |
| Outcome 2.1 — Youth trained in ICT | 4,800 | 3,800 | **4,800** | RF wins. MP 2026 milestone of 1,000 retained. |
| Outcome 2.2 — New tech businesses | (target blank in RF) | 40 (MP 2028) + 10 (MP 2026) | **50** *(provisional)* | RF cell is empty; using MP cumulative sum. **Flag for client.** |
| Outcome 3.1 — Firms operating | 15 | 10 | **15** | RF wins. MP 2026 milestone of 5 retained. |
| Outcome 3.2 — Operating revenue | $10.8M | $5M | **$10.8M** | RF wins. MP 2026 milestone of $2M retained. |
| Outcome 3.3 — Additional financing | $5M | $4M | **$5M** | RF wins. MP 2026 milestone of $1M retained. |
| Outcome 4.1 — GHG emission savings | 10.6 tCO2e/yr | 10.6 | **10.6 tCO2e/yr** | Consistent. |
| Outcome 4.2 — Climate measures | 3 | 2+1=3 (MP) | **3** | Consistent. Treat as `incremental` (2 by 2026, 1 by 2028). |
| Output 1.1 — Data centre | 2 | 0+2=2 | **2** | Consistent. Treat as `incremental` (none by 2026, 2 by 2028). |
| Output 1.2 — Buildings | 12 | 8+2=10 | **12** | RF wins. MP 2026 milestone of 8 retained; completion adjusted to 12. **Flag the 10 vs 12 gap with the client** — likely RF includes 2 buildings the MP missed. |
| Output 1.3 — Fiber optic km | 9.5 | 9.5 | **9.5 km** | Consistent. |
| Output 2.1 — Roads km | 1.86 | 1.86 | **1.86 km** | Consistent. |
| Output 2.2 — Electricity capacity | 5 MW | 5 MW | **5 MW** | Consistent. |
| Output 2.3 — Renewable capacity | 3 MW | 3 MW | **3 MW** | Consistent. |
| Output 2.4 — Waste mgmt plan | 1 | 1 | **1** | Consistent. Treat as `binary`. |
| Output 2.5 — Potable water km | 2.38 | 2.38 | **2.38 km** | Consistent. |
| Output 2.6 — Sewer km | 1.03 | 1.03 | **1.03 km** | Consistent. |
| Output 3.1 — Centres of excellence | 10 | 8+2=10 | **10** | Consistent. Treat as `incremental` (8 by 2026, 2 by 2028). |
| Output 3.2 — University alliances | 4 | 4 | **4** | Consistent. |
| Output 3.3 — Devices provided | 200 | 100+100=200 | **200** | Consistent. Treat as `incremental` (100 by 2026, 100 by 2028). |
| Output 3.4 — Innovation labs | 4 | 4 | **4** | Consistent. |
| Output 4.1 — Youth trained & certified | 8,000 | 4,000+4,000=8,000 | **8,000** | Consistent. Treat as `incremental`. |
| Output 4.2 — Hackathons | 4 | 2+2=4 | **4** | Consistent. Treat as `incremental`. |
| Output 5.1 — EIF set up | $5M | $5M | **$5M** | Consistent. Treat as `binary` capitalisation milestone. |
| Output 5.2 — Capacity building facility | $1M | $0.5M+$0.5M=$1M | **$1M** | Consistent. Treat as `incremental`. |
| Output 5.3 — Pre-seed startups funded | 50 | 20 | **50** | RF wins. MP only had a single 2028 figure (20). |
| Output 6.1 — SPV operationalised | 1 | 1 | **1** | Consistent. Treat as `binary`. |
| Output 6.2 — Innovation policy | Yes | Yes | **Yes** | Consistent. Treat as `binary`. |
| Output 6.3 — Climate policy | Yes | Yes | **Yes** | Consistent. Treat as `binary`. |
| Output 6.4 — Roadshows | 5 | 1 | **5** | RF wins. MP only had a single annual figure. Treat as `incremental` across years; allocation to be confirmed with client (proposed 1 per year 2024-2028). |
| Output 6.5 — Resettlement compensation | $2.5M | $2.5M | **$2.5M** | Consistent. Treat as `binary` (paid in full when complete). |

### Alignment indicators (context only — see ADR 0002)

| Indicator | Baseline | Target | Source |
|---|---|---|---|
| Youth unemployment rate | 42.5% (Q4 2020) | 30% (Q4 2026) | NBS Labour Force Survey |
| Population below poverty line | 40.1% (2019) | 38% (2026) | NBS Poverty Reports |

### Items still to confirm with client

The following are flagged because the resolution required engineering judgement:

1. **Outcome 2.2 — New tech businesses created.** RF target is blank; we assumed cumulative MP (50). **Confirm.**
2. **Output 1.2 — Buildings, RF=12 vs MP=10.** We chose 12 (RF wins). **Confirm.**
3. **Output 6.4 — Roadshows, RF=5 vs MP=1.** Confirm cadence: 1 per year × 5 years (2024–2028) is our proposed allocation.
4. **Output 5.3 — Pre-seed startups, RF=50 vs MP=20.** Possible the 20 was a 2028-year-only number under cumulative reading. We chose 50 cumulative.

## Rationale

1. **The Results Framework is the contractual instrument.** In AfDB Results-Based Management practice, the RF is annexed to the project appraisal report and signed at appraisal. The Monitoring Plan is the operational companion. AfDB supervision missions and the Project Completion Report are scored against the RF, not the MP. World Bank, EU Commission, and IFAD operate identically.

2. **Several MP "2028" values are demonstrably typos.**
   - Outcome 1.1 MP 2028 says 49,045 direct jobs, while its own 30%-milestone column shows 2,102.1 — which is exactly 30% of 7,007 (the RF value). The MP value cannot be both 49,045 and have a 30%-marker at 2,102.1.
   - Outcome 1.2 MP says 13,245 indirect jobs but shows a 30%-marker at 5,681, which is 30% × 18,936 (≈ RF's 18,935).

3. **Where the MP is mathematically self-consistent but disagrees with the RF**, the lower MP number is treated as a probable mid-revision draft. The RF value, being contractual, prevails until the client says otherwise.

4. **Cumulative vs incremental classification** comes from the structure of the MP itself: where the year columns sum to the RF target, the indicator is `incremental` (deliveries in slices); where the year columns are running totals (the larger 2026 column doesn't equal the 2028 column added back in), the indicator is `cumulative`.

## What we are NOT doing

- We are not changing AfDB's contractual targets. The client must drive any RF revision through the Bank's amendment process.
- We are not silently averaging conflicting numbers — every conflict is resolved with a stated reason.
- We are not seeding live data yet (per [IMPLEMENTATION_PLAN.md](../../IMPLEMENTATION_PLAN.md) Phase 10). These targets feed Phase 10 once schema is in place.

## Revisit if

- The client says the Monitoring Plan was the more recent revision — in which case targets flip to MP, with RF treated as the appraisal baseline.
- The Bank approves a formal RF amendment (typical at mid-term review).
- New per-year breakdowns are issued in a Bank supervision aide-mémoire.

## References

- AfDB Operations Manual — Results-Based Management framework
- AfDB Project Appraisal Report template (logframe annex) for SAP P-NG-K00-009
- World Bank "Results Framework and M&E" guidance note (2018) — analogous practice
