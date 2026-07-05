import { describe, expect, it } from 'vitest';

import { getSpendingVsAverageProgressValue } from '@/lib/reports/compute-spending-vs-average-progress';

describe('getSpendingVsAverageProgressValue', () => {
  it('places the average at the center of the bar', () => {
    expect(getSpendingVsAverageProgressValue(100)).toBe(50);
  });

  it('fills past the center when spending exceeds the average', () => {
    expect(getSpendingVsAverageProgressValue(125)).toBe(62.5);
  });

  it('fills the full bar at twice the average', () => {
    expect(getSpendingVsAverageProgressValue(200)).toBe(100);
  });

  it('caps fill at 100% when spending exceeds twice the average', () => {
    expect(getSpendingVsAverageProgressValue(250)).toBe(100);
  });

  it('clamps negative values to zero', () => {
    expect(getSpendingVsAverageProgressValue(-10)).toBe(0);
  });
});
