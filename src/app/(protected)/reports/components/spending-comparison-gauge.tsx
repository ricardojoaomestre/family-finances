'use client';

import { ArrowDownIcon, ArrowUpIcon } from 'lucide-react';

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import type { SpendingComparison } from '@/lib/reports/compute-spending-comparison';
import { formatDisplayMoney } from '@/lib/formatters';
import { cn } from '@/lib/utils';

type SpendingComparisonGaugeProps = {
  comparison: SpendingComparison;
};

function getComparisonLabel(comparison: Exclude<SpendingComparison, { kind: 'hidden' }>) {
  const averageLabel = formatDisplayMoney(comparison.average);

  if (comparison.kind === 'flat') {
    return `Same as your ${comparison.monthLabels} average (${averageLabel})`;
  }

  const direction = comparison.kind === 'up' ? 'above' : 'below';

  return `${comparison.percent}% ${direction} your ${comparison.monthLabels} average (${averageLabel})`;
}

export function SpendingComparisonGauge({
  comparison,
}: SpendingComparisonGaugeProps) {
  if (comparison.kind === 'hidden') {
    return null;
  }

  const label = getComparisonLabel(comparison);

  if (comparison.kind === 'flat') {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <span
              className="text-xs text-muted-foreground tabular-nums"
              aria-label={label}
            >
              —
            </span>
          </TooltipTrigger>
          <TooltipContent>{label}</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  const isUp = comparison.kind === 'up';

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span
            className={cn(
              'inline-flex items-center gap-0.5 text-xs font-medium tabular-nums',
              isUp ? 'text-destructive' : 'text-success',
            )}
            aria-label={label}
          >
            {isUp ? (
              <ArrowUpIcon className="size-3 shrink-0" aria-hidden />
            ) : (
              <ArrowDownIcon className="size-3 shrink-0" aria-hidden />
            )}
            {comparison.percent}%
          </span>
        </TooltipTrigger>
        <TooltipContent>{label}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
