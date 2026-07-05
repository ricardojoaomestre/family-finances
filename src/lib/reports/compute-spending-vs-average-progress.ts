export const SPENDING_VS_AVERAGE_BAR_MAX_PERCENT = 200;

export function getSpendingVsAverageProgressValue(
  percentOfAverage: number,
): number {
  const clamped = Math.max(0, percentOfAverage);

  return Math.min(
    100,
    (clamped / SPENDING_VS_AVERAGE_BAR_MAX_PERCENT) * 100,
  );
}
