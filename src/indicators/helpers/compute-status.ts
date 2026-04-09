export function computeStatus(currentValue: number, target: number): string {
  if (target === 0) return 'off_track';
  const ratio = currentValue / target;
  if (ratio >= 0.9) return 'on_track';
  if (ratio >= 0.6) return 'at_risk';
  return 'off_track';
}
