# ADR 0002 — Logframe Hierarchy Interpretation

**Status:** Proposed (industry-standard default; pending client confirmation)
**Date:** 2026-05-07
**Phase:** 0 — Reconciliation & Locked Decisions
**Decider:** Engineering (default); to be confirmed by EKDIPA M&E focal point

---

## Context

The client documents present two different views of the project's results chain:

- **Results Framework** groups indicators under **Outcome Statements** (1–4) and, separately, under **Components** (1–3) → **Output Statements** (1–6).
- **Monitoring Plan** lists Outcome Indicators and Output Indicators in flat tables with no explicit Component / Output-Statement parentage.

Our existing schema models a strictly linear `goal → outcome → output → activity` tree, which represents neither view correctly. We must commit to one canonical interpretation before the schema migration in Phase 1 lands.

## Decision

**Adopt a parallel-branch hierarchy under a single PDO root, mirroring AfDB Results-Based Management.**

### Canonical structure

```
PDO (single root)
│
├── ALIGNMENT (context-only branch)
│       └── alignment indicators (NBS-sourced — see ADR 0001)
│
├── OUTCOME_STATEMENT (4 nodes, siblings of components)
│       └── outcome indicators
│             └── (informational links to contributing outputs — see below)
│
└── COMPONENT (3 nodes; carry budget envelopes)
        └── OUTPUT_STATEMENT (1..n)
              └── output indicators
                    └── ACTIVITY (optional leaf, only where the project tracks
                                  sub-deliverables that are not themselves indicators)
```

### Rules

1. **Exactly one PDO node** per logframe. Enforced by application logic (`validateAtMostOneOfType('pdo')`).
2. **Outcome Statements are siblings of Components**, both parented by the PDO. Outcomes are *not* parents of outputs.
3. **Each Output Statement belongs to exactly one Component.** No cross-cutting outputs in this RF. Enforced by FK + parent-type rule.
4. **Each Output Indicator belongs to exactly one Output Statement.**
5. **Each Outcome Indicator belongs to exactly one Outcome Statement.**
6. **Activities are optional leaves under Output Indicators or Output Statements.** Used only when the project elects to track milestones below indicator level.
7. **Outcome → Output linkage is informational, not structural.** An outcome indicator may declare that it is "fed by" specific output indicators, via a join table (`outcome_output_links`). This drives reporting rollups but is not part of the parent/child tree.
8. **Alignment indicators sit in their own bucket** under the PDO, distinct from outcomes. They are context (see ADR 0001) and never roll up into project performance scoring.

### Parent-type rules (machine-readable)

```ts
// Replaces PARENT_TYPE_MAP in ekz-server/src/logframe/logframe.service.ts
const PARENT_TYPE_MAP: Record<string, string[] | null> = {
  pdo:                null,
  alignment:          ['pdo'],
  component:          ['pdo'],
  outcome_statement:  ['pdo'],
  output_statement:   ['component'],
  activity:           ['output_statement'],

  // Legacy values (kept for migration safety; deprecated for new nodes)
  goal:               null,
  outcome:            ['goal', 'pdo'],
  output:             ['outcome', 'output_statement'],
};
```

### Indicator `kind` ↔ node `type` mapping

| Indicator kind | Lives under node type |
|---|---|
| `alignment` | `alignment` |
| `outcome` | `outcome_statement` |
| `output` | `output_statement` |
| `activity` *(rare)* | `activity` |

This is enforced as a soft validation: a 400 error if `indicator.kind = 'output'` is linked to a non-output_statement node.

### New join table for outcome→output linkage (informational)

```sql
CREATE TABLE outcome_output_links (
  outcome_indicator_id UUID NOT NULL REFERENCES indicators(id) ON DELETE CASCADE,
  output_indicator_id  UUID NOT NULL REFERENCES indicators(id) ON DELETE CASCADE,
  weight               NUMERIC NOT NULL DEFAULT 1.0,    -- for weighted rollups
  PRIMARY KEY (outcome_indicator_id, output_indicator_id)
);
```

Used by the AfDB report to show "Outcome 1 is delivered by Outputs 4.1, 4.2, 5.1, 5.3" without making outputs structurally subordinate to outcomes.

## Rationale

1. **AfDB Results-Based Management documents outcomes and outputs as parallel results levels under the PDO.** Both contribute to the PDO; outcomes are *medium-term* changes (jobs created, talent developed); outputs are *short-term* deliverables (kilometres of road, number of buildings). They are tracked independently and only linked at the rollup layer.

2. **Components are budget envelopes, not result types.** The RF explicitly groups Output Statements under Components (with $65M / $10.4M / $4.4M splits). Outcomes are not budgeted at component level — a single outcome (e.g. "Jobs created") is delivered by outputs from multiple components.

3. **A single PDO root is universal across AfDB / World Bank / IFAD logframes.** Multi-PDO projects exist but are rare and out of scope for this engagement.

4. **Activities as optional leaves** lets the existing dev seed data (which uses `activity` nodes) keep working through the migration without losing referential integrity.

5. **Outcome→output linkage as a separate table** keeps the parent/child tree clean while still letting reports answer "which outputs deliver this outcome?". The alternative — making outcomes parents of outputs — would force an artificial choice when a single output contributes to multiple outcomes (and several do, e.g. Output 4.1 youth training feeds both Outcome 1 jobs and Outcome 2 talents).

## What we are NOT doing

- We are not flattening the hierarchy. Components and Output Statements are real levels with real semantics (budget, deliverable cluster).
- We are not making outcomes parents of outputs. The existing linear `outcome → output` model is wrong for this project; we deprecate it.
- We are not removing the legacy `goal/outcome/output/activity` types from the CHECK constraint immediately. They survive the migration so dev data stays valid; a later migration (Phase 10 cleanup) drops them.
- We are not modelling sub-components (e.g. "Component 1.A"). The RF doesn't have them.

## Revisit if

- The client confirms a different reading (e.g. outcomes are intended as parents of outputs in a strict tree).
- AfDB issues a revised template that introduces sub-components or PDO-level themes.
- A future programme stacks multiple PDOs (multi-project logframe) — this would force a project-scoped hierarchy.

## References

- AfDB *Results Reporting Guidelines for Sovereign Operations*
- AfDB *Project Appraisal Report* template, Annex 1 (Logframe) and Annex 2 (Theory of Change)
- World Bank *Results Framework and M&E* guidance note — equivalent parallel-branch model
- OECD-DAC results chain conventions (Inputs → Activities → Outputs → Outcomes → Impact)
