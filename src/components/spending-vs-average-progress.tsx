'use client';

import {
  getSpendingVsAverageProgressValue,
  SPENDING_VS_AVERAGE_BAR_MAX_PERCENT,
} from '@/lib/reports/compute-spending-vs-average-progress';
import { cn } from '@/lib/utils';

type SpendingVsAverageProgressProps = {
  percentOfAverage: number;
  hasBaseline?: boolean;
  isOverAverage?: boolean;
  className?: string;
};

export function SpendingVsAverageProgress({
  percentOfAverage,
  hasBaseline = true,
  isOverAverage = false,
  className,
}: SpendingVsAverageProgressProps) {
  const fillPercent = hasBaseline
    ? getSpendingVsAverageProgressValue(percentOfAverage)
    : 0;

  return (
    <div
      role="progressbar"
      aria-valuenow={hasBaseline ? percentOfAverage : 0}
      aria-valuemin={0}
      aria-valuemax={SPENDING_VS_AVERAGE_BAR_MAX_PERCENT}
      aria-hidden={!hasBaseline}
      className={cn(
        'relative h-3 w-full overflow-hidden rounded-full bg-muted',
        className,
      )}
    >
      <div
        data-slot="progress-indicator"
        className={cn(
          'absolute inset-y-0 left-0 rounded-full transition-all',
          isOverAverage ? 'bg-destructive' : 'bg-primary',
        )}
        style={{ width: `${fillPercent}%` }}
      />
      {hasBaseline ? (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-y-0.5 left-1/2 z-10 w-0.5 -translate-x-1/2 rounded-full bg-foreground/35"
        />
      ) : null}
    </div>
  );
}
