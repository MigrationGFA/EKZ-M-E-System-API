/**
 * Map a current value vs the *expected* value (typically the year-aware
 * `expectedAt(...)` result) onto an indicator status string.
 *
 * The thresholds (>= 0.9 on_track, >= 0.6 at_risk, else off_track) are the
 * same as before Phase 3 — only the second argument's meaning changed:
 * pre-Phase-3 callers passed `indicator.target` (lifetime); Phase 3 callers
 * pass `expectedAt(indicator, yearTargets, now)`. For indicators with no
 * year targets, `expectedAt` falls back to `indicator.target`, so legacy
 * behaviour is preserved.
 */
export function computeStatus(currentValue: number, expected: number): string {
  if (expected === 0) return 'off_track';
  const ratio = currentValue / expected;
  if (ratio >= 0.9) return 'on_track';
  if (ratio >= 0.6) return 'at_risk';
  return 'off_track';
}
