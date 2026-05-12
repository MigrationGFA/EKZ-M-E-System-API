import { ALL_INDICATORS, type IndicatorSpec } from './indicators.js';
import { NODES, type NodeSpec } from './logframe.js';

/**
 * Phase 10 seed structure spec.
 *
 * Pure data-shape assertions — no DB, no DI. The seed scripts themselves
 * run against the real DB during `pnpm seed` and the integration check is
 * the "two consecutive runs are a no-op" property documented in the PR.
 *
 * What we assert here:
 *   1. Indicator counts match the Results Framework (2 alignment + 9
 *      outcome + 23 output = 34).
 *   2. Every indicator's parentNodeCode resolves against a seeded node.
 *   3. Every indicator carries methodology / responsible_party /
 *      means_of_verification (so the QPR PDF never renders blanks).
 *   4. Year-target arithmetic agrees with ADR 0001:
 *        - incremental indicators sum to their RF target.
 *        - cumulative indicators' final-year value equals their RF target.
 *        - binary indicators have at least one year_target reaching 1
 *          (or the target value for $-denominated binaries).
 *   5. The logframe tree is well-formed: exactly one PDO; every non-PDO
 *      node has a parent that exists in the same set; components carry
 *      a positive budget; output statements live under components.
 */

const codeKey = (i: IndicatorSpec): string => `${i.kind}:${i.code}`;

function nodeKey(n: NodeSpec): string {
  return `${n.type}:${n.code}`;
}

describe('Phase 10 seed — indicator + logframe structure', () => {
  const indicatorsByKind = ALL_INDICATORS.reduce<Record<string, number>>(
    (acc, i) => {
      acc[i.kind] = (acc[i.kind] ?? 0) + 1;
      return acc;
    },
    {},
  );

  it('matches the Results Framework counts (2 / 9 / 23 = 34)', () => {
    expect(indicatorsByKind.alignment).toBe(2);
    expect(indicatorsByKind.outcome).toBe(9);
    expect(indicatorsByKind.output).toBe(23);
    expect(ALL_INDICATORS).toHaveLength(34);
  });

  it('has unique (code, kind) per indicator', () => {
    const seen = new Set<string>();
    for (const ind of ALL_INDICATORS) {
      const key = codeKey(ind);
      expect(seen.has(key)).toBe(false);
      seen.add(key);
    }
  });

  it('points every indicator at a logframe node that is actually seeded', () => {
    const seededNodeKeys = new Set(NODES.map(nodeKey));
    for (const ind of ALL_INDICATORS) {
      const key = `${ind.parentNodeType}:${ind.parentNodeCode}`;
      expect(seededNodeKeys.has(key)).toBe(true);
    }
  });

  it('fills methodology / responsible_party / MoV for every indicator', () => {
    for (const ind of ALL_INDICATORS) {
      expect(ind.methodology.length).toBeGreaterThan(0);
      expect(ind.responsible_party.length).toBeGreaterThan(0);
      expect(ind.means_of_verification.length).toBeGreaterThan(0);
    }
  });

  it('uses the ADR-0004 frequency enum exclusively', () => {
    const allowed = new Set([
      'monthly',
      'quarterly',
      'bi_annually',
      'annually',
      'mid_term',
      'one_off',
    ]);
    for (const ind of ALL_INDICATORS) {
      expect(allowed.has(ind.frequency)).toBe(true);
    }
  });

  describe('year-target arithmetic agrees with ADR 0001', () => {
    function totals(ind: IndicatorSpec): number {
      return ind.year_targets.reduce((s, y) => s + y.target_value, 0);
    }
    function lastValue(ind: IndicatorSpec): number {
      const last = [...ind.year_targets].sort((a, b) => a.year - b.year).pop();
      return last ? last.target_value : 0;
    }

    it('incremental indicators sum to RF target', () => {
      for (const ind of ALL_INDICATORS) {
        if (ind.target_mode !== 'incremental') continue;
        expect(totals(ind)).toBeCloseTo(ind.target, 4);
      }
    });

    it('cumulative indicators end at RF target', () => {
      for (const ind of ALL_INDICATORS) {
        if (ind.target_mode !== 'cumulative') continue;
        expect(lastValue(ind)).toBeCloseTo(ind.target, 4);
      }
    });

    it('binary indicators reach their target by 2028', () => {
      for (const ind of ALL_INDICATORS) {
        if (ind.target_mode !== 'binary') continue;
        // Last (latest-year) row must == target.
        expect(lastValue(ind)).toBeCloseTo(ind.target, 4);
      }
    });
  });

  describe('logframe tree is well-formed', () => {
    it('has exactly one PDO node', () => {
      const pdos = NODES.filter((n) => n.type === 'pdo');
      expect(pdos).toHaveLength(1);
      expect(pdos[0].parentCode).toBeNull();
    });

    it('parents every non-PDO node by a node in the same set', () => {
      const nodeKeys = new Set(NODES.map(nodeKey));
      for (const n of NODES) {
        if (n.type === 'pdo') continue;
        const key = `${n.parentType}:${n.parentCode}`;
        expect(nodeKeys.has(key)).toBe(true);
      }
    });

    it('budgets components positively and leaves other nodes nullable', () => {
      for (const n of NODES) {
        if (n.type === 'component') {
          expect(n.budget_usd).not.toBeNull();
          expect(n.budget_usd ?? 0).toBeGreaterThan(0);
        } else {
          expect(n.budget_usd).toBeNull();
        }
      }
    });

    it('puts every output_statement under a component', () => {
      for (const n of NODES) {
        if (n.type !== 'output_statement') continue;
        expect(n.parentType).toBe('component');
      }
    });

    it('sums component budgets to the RF total ($79.8M)', () => {
      const total = NODES.filter((n) => n.type === 'component').reduce(
        (s, n) => s + (n.budget_usd ?? 0),
        0,
      );
      // 65 + 10.4 + 4.4 = 79.8 (RF Components 1–3).
      expect(total).toBe(79_800_000);
    });
  });
});
