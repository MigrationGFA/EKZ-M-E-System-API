import { expectedAt } from './expected-progress.js';

describe('expectedAt', () => {
  describe('fallback when no year targets', () => {
    it('returns indicator.target regardless of asOf or mode', () => {
      const result = expectedAt(
        { target_mode: 'cumulative', target: 5000, baseline: 0 },
        [],
        new Date('2026-06-01T00:00:00Z'),
      );
      expect(result).toBe(5000);
    });

    it('coerces a string indicator.target', () => {
      const result = expectedAt(
        { target_mode: 'cumulative', target: '5000', baseline: 0 },
        [],
        new Date('2026-06-01T00:00:00Z'),
      );
      expect(result).toBe(5000);
    });
  });

  describe('cumulative', () => {
    const indicator = {
      target_mode: 'cumulative' as const,
      target: 5000,
      baseline: 100,
    };
    const yearTargets = [
      { year: 2024, target_value: 1000 },
      { year: 2026, target_value: 3000 },
      { year: 2028, target_value: 5000 },
    ];

    it('returns first.target_value when asOf is exactly Jan 1 of first year', () => {
      const result = expectedAt(
        indicator,
        yearTargets,
        new Date('2024-01-01T00:00:00Z'),
      );
      expect(result).toBe(1000);
    });

    it('interpolates linearly between two milestones', () => {
      const result = expectedAt(
        indicator,
        yearTargets,
        new Date('2025-01-01T00:00:00Z'),
      );
      expect(result).toBeCloseTo(2000, 5);
    });

    it('returns last.target_value when asOf is at the last year boundary', () => {
      const result = expectedAt(
        indicator,
        yearTargets,
        new Date('2028-01-01T00:00:00Z'),
      );
      expect(result).toBe(5000);
    });

    it('returns last.target_value when asOf is past the last year', () => {
      const result = expectedAt(
        indicator,
        yearTargets,
        new Date('2030-06-01T00:00:00Z'),
      );
      expect(result).toBe(5000);
    });

    it('falls back to baseline when asOf is pre-range and no baselineDate', () => {
      const result = expectedAt(
        indicator,
        yearTargets,
        new Date('2022-06-01T00:00:00Z'),
      );
      expect(result).toBe(100);
    });

    it('interpolates from baseline when baselineDate provided and asOf is pre-range', () => {
      const result = expectedAt(
        indicator,
        yearTargets,
        new Date('2023-01-01T00:00:00Z'),
        { baselineDate: new Date(Date.UTC(2022, 0, 1)) },
      );
      expect(result).toBeCloseTo(550, 5);
    });

    it('clamps to baselineDate when asOf is before baselineDate itself', () => {
      const result = expectedAt(
        indicator,
        yearTargets,
        new Date('2020-06-01T00:00:00Z'),
        { baselineDate: new Date(Date.UTC(2022, 0, 1)) },
      );
      expect(result).toBe(100);
    });

    it('handles a single year target', () => {
      const single = [{ year: 2026, target_value: 3000 }];
      expect(
        expectedAt(indicator, single, new Date('2026-01-01T00:00:00Z')),
      ).toBe(3000);
      expect(
        expectedAt(indicator, single, new Date('2027-06-01T00:00:00Z')),
      ).toBe(3000);
      expect(
        expectedAt(indicator, single, new Date('2025-06-01T00:00:00Z')),
      ).toBe(100);
    });

    it('respects unsorted input', () => {
      const unsorted = [
        { year: 2028, target_value: 5000 },
        { year: 2024, target_value: 1000 },
        { year: 2026, target_value: 3000 },
      ];
      const result = expectedAt(
        indicator,
        unsorted,
        new Date('2025-01-01T00:00:00Z'),
      );
      expect(result).toBeCloseTo(2000, 5);
    });

    it('does not mutate the caller-provided yearTargets array', () => {
      const input = [
        { year: 2028, target_value: 5000 },
        { year: 2024, target_value: 1000 },
      ];
      const snapshot = JSON.stringify(input);
      expectedAt(indicator, input, new Date('2025-01-01T00:00:00Z'));
      expect(JSON.stringify(input)).toBe(snapshot);
    });
  });

  describe('incremental', () => {
    const indicator = {
      target_mode: 'incremental' as const,
      target: 6000,
      baseline: 0,
    };
    const yearTargets = [
      { year: 2024, target_value: 1000 },
      { year: 2025, target_value: 2000 },
      { year: 2026, target_value: 3000 },
    ];

    it('returns 0 before the first year', () => {
      const result = expectedAt(
        indicator,
        yearTargets,
        new Date('2023-06-01T00:00:00Z'),
      );
      expect(result).toBe(0);
    });

    it('sums past years and partial current-year slice', () => {
      const result = expectedAt(
        indicator,
        yearTargets,
        new Date('2025-07-02T12:00:00Z'),
      );
      expect(result).toBeGreaterThan(1900);
      expect(result).toBeLessThan(2100);
    });

    it('returns full sum after the last year', () => {
      const result = expectedAt(
        indicator,
        yearTargets,
        new Date('2027-01-01T00:00:00Z'),
      );
      expect(result).toBe(6000);
    });

    it('returns full past slices at the start of a new year', () => {
      const result = expectedAt(
        indicator,
        yearTargets,
        new Date('2025-01-01T00:00:00Z'),
      );
      expect(result).toBeCloseTo(1000, 5);
    });
  });

  describe('binary', () => {
    const indicator = {
      target_mode: 'binary' as const,
      target: 1,
      baseline: 0,
    };
    const yearTargets = [{ year: 2026, target_value: 1 }];

    it('returns 0 before the target year', () => {
      const result = expectedAt(
        indicator,
        yearTargets,
        new Date('2025-12-31T00:00:00Z'),
      );
      expect(result).toBe(0);
    });

    it('returns target_value at the target year', () => {
      const result = expectedAt(
        indicator,
        yearTargets,
        new Date('2026-01-01T00:00:00Z'),
      );
      expect(result).toBe(1);
    });

    it('returns target_value after the target year', () => {
      const result = expectedAt(
        indicator,
        yearTargets,
        new Date('2027-06-01T00:00:00Z'),
      );
      expect(result).toBe(1);
    });
  });

  describe('numeric coercion', () => {
    it('handles string-typed values from TypeORM NUMERIC', () => {
      const result = expectedAt(
        {
          target_mode: 'cumulative',
          target: '5000' as unknown as number,
          baseline: '100' as unknown as number,
        },
        [{ year: 2024, target_value: '1000' as unknown as number }],
        new Date('2024-01-01T00:00:00Z'),
      );
      expect(result).toBe(1000);
    });
  });
});
