# AfDB Alignment — Planning & Decisions

Cross-repo planning artifacts for aligning the EKZ M&E system to the AfDB-grade Results Framework + Monitoring Plan delivered by the client.

## Contents

| Document | Purpose |
|---|---|
| [IMPLEMENTATION_PLAN.md](IMPLEMENTATION_PLAN.md) | 10-phase plan + 5 cross-cutting tracks. Authoritative roadmap. |
| [AUDIT_FINDINGS.md](AUDIT_FINDINGS.md) | Security / correctness gaps in the current codebase. Independent track. |
| [decisions/](decisions/) | Architecture Decision Records (ADRs) for Phase 0 reconciliation. |

## A note on file paths in these docs

These documents were authored from the **project-root perspective**, where both repos live as sibling directories:

```
ekz-project/                  ← workspace root (untracked)
├── ekz/                      ← frontend repo
├── ekz-server/               ← backend repo (you are here)
└── Client-Update/            ← client-provided source documents
```

Paths like `ekz/lib/api.ts` or `Client-Update/Result-FrameWork.md` refer to that layout — they are informational and won't resolve as clickable links inside this repo. Same-folder links (e.g. between `IMPLEMENTATION_PLAN.md` and `AUDIT_FINDINGS.md`) and ADR cross-references work normally.

## Why these docs live in the backend repo

The structural decisions (schema migrations, hierarchy rules, logframe semantics) primarily affect the backend. By convention, the backend repo carries the system-of-record for cross-cutting architecture docs; the frontend repo references them.

## Status

- ADRs 0001–0006: **Proposed** (industry-standard defaults; awaiting client confirmation).
- Implementation plan: **Active** (Phase 1 in progress on this branch).
