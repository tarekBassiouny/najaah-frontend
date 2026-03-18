/**
 * Compute period-over-period trend for stats card arrows.
 * Returns null when comparison is not meaningful (no previous data).
 */
export function computeTrend(
  current: number,
  previous: number | undefined | null,
): { value: number; isPositive: boolean } | undefined {
  if (previous == null || !Number.isFinite(previous)) return undefined;
  if (previous === 0 && current === 0) return undefined;
  if (previous === 0) return { value: 100, isPositive: current > 0 };

  const change = ((current - previous) / previous) * 100;
  return {
    value: Math.abs(Math.round(change)),
    isPositive: change >= 0,
  };
}
