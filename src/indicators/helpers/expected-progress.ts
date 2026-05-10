/**
 * Year-aware expected-progress helper.
 *
 * Returns the value the indicator *should* have reached by `asOf`, given
 * its `target_mode` and the multi-year targets table introduced in Phase 3.
 *
 * Behaviour by mode:
 *   - cumulative: linear interpolation between the two surrounding milestones
 *     (or between the optional baselineDate and the first milestone for
 *     pre-range dates); clamped to last milestone after the last year.
 *   - incremental: sum of the slices for years strictly less than asOf.year,
 *     plus a fractional day-of-year share of the current year's slice.
 *   - binary: target_value of the latest year-target row whose year <= asOf;
 *     else 0.
 *
 * When `yearTargets` is empty the helper falls back to `indicator.target`.
 * This preserves the pre-Phase-3 status semantics for any indicator that has
 * not yet adopted year targets.
 *
 * Pure function — no DB / no DI. Service callers fetch year targets and
 * (optionally) project_meta.baseline_year and pass them in.
 */

export type TargetMode = 'cumulative' | 'incremental' | 'binary';

export interface YearTargetInput {
  year: number;
  target_value: number | string;
}

export interface ExpectedAtIndicator {
  target_mode: string;
  target: number | string;
  baseline: number | string;
}

export interface ExpectedAtOptions {
  baselineDate?: Date;
}

interface SortedTarget {
  year: number;
  target_value: number;
}

export function expectedAt(
  indicator: ExpectedAtIndicator,
  yearTargets: YearTargetInput[],
  asOf: Date,
  options?: ExpectedAtOptions,
): number {
  if (yearTargets.length === 0) {
    return Number(indicator.target);
  }

  const sorted: SortedTarget[] = [...yearTargets]
    .map((t) => ({ year: t.year, target_value: Number(t.target_value) }))
    .sort((a, b) => a.year - b.year);

  switch (indicator.target_mode) {
    case 'binary':
      return binaryExpected(sorted, asOf);
    case 'incremental':
      return incrementalExpected(sorted, asOf);
    case 'cumulative':
    default:
      return cumulativeExpected(
        sorted,
        Number(indicator.baseline),
        asOf,
        options?.baselineDate,
      );
  }
}

function binaryExpected(sorted: SortedTarget[], asOf: Date): number {
  const asOfYear = asOf.getUTCFullYear();
  let result = 0;
  for (const t of sorted) {
    if (t.year <= asOfYear) result = t.target_value;
  }
  return result;
}

function incrementalExpected(sorted: SortedTarget[], asOf: Date): number {
  const asOfYear = asOf.getUTCFullYear();
  let total = 0;
  for (const t of sorted) {
    if (t.year < asOfYear) {
      total += t.target_value;
    } else if (t.year === asOfYear) {
      total += t.target_value * yearFraction(asOf);
    }
  }
  return total;
}

function cumulativeExpected(
  sorted: SortedTarget[],
  baseline: number,
  asOf: Date,
  baselineDate: Date | undefined,
): number {
  const first = sorted[0];
  const firstDate = jan1Utc(first.year);

  if (asOf < firstDate) {
    if (baselineDate && baselineDate < firstDate) {
      const clampedAsOf = asOf < baselineDate ? baselineDate : asOf;
      return interpolateByYear(
        baselineDate.getUTCFullYear(),
        baseline,
        first.year,
        first.target_value,
        clampedAsOf,
      );
    }
    return baseline;
  }

  for (let i = 0; i < sorted.length - 1; i++) {
    const lowerDate = jan1Utc(sorted[i].year);
    const upperDate = jan1Utc(sorted[i + 1].year);
    if (asOf >= lowerDate && asOf < upperDate) {
      return interpolateByYear(
        sorted[i].year,
        sorted[i].target_value,
        sorted[i + 1].year,
        sorted[i + 1].target_value,
        asOf,
      );
    }
  }

  // asOf is at or after the last milestone's date
  return sorted[sorted.length - 1].target_value;
}

function jan1Utc(year: number): Date {
  return new Date(Date.UTC(year, 0, 1));
}

function yearFraction(asOf: Date): number {
  const year = asOf.getUTCFullYear();
  const start = Date.UTC(year, 0, 1);
  const end = Date.UTC(year + 1, 0, 1);
  return (asOf.getTime() - start) / (end - start);
}

/**
 * Year-fraction interpolation: each calendar year contributes 1.0 unit of
 * progress regardless of leap-year length. Avoids the leap-year skew you'd
 * get from millisecond-precision interpolation, which is the right call for
 * an annual-cadence M&E system where indicators are reported by year.
 *
 * Assumes baseline-style dates anchor at Jan 1 of their year (true for
 * project_meta.baseline_year and for year-target jan1Utc anchors).
 */
function interpolateByYear(
  fromYear: number,
  v1: number,
  toYear: number,
  v2: number,
  asOf: Date,
): number {
  const span = toYear - fromYear;
  if (span === 0) return v1;
  const yearsElapsed = asOf.getUTCFullYear() - fromYear + yearFraction(asOf);
  return v1 + (v2 - v1) * (yearsElapsed / span);
}
