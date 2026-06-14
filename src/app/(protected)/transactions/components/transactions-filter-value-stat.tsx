'use client';

import { ChevronDownIcon, Loader2Icon } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';

import { getFilteredTransactionValueStatsAction } from '@/app/(protected)/transactions/actions/get-filtered-transaction-value-stats';
import type { TransactionFilters } from '@/app/(protected)/transactions/lib/filter-transactions';
import { getMoneyValueColorClass } from '@/components/data-table/table-money-cell';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { formatDisplayMoney } from '@/lib/formatters';
import type { FilteredTransactionValueStats } from '@/lib/transactions/get-filtered-transaction-value-stats';
import { cn } from '@/lib/utils';

const FETCH_DEBOUNCE_MS = 300;

type ValueStatMetric = 'sum' | 'avg' | 'min' | 'max';

const METRIC_LABELS: Record<ValueStatMetric, string> = {
  sum: 'Sum',
  avg: 'Avg',
  min: 'Min',
  max: 'Max',
};

type TransactionsFilterValueStatProps = {
  filters: TransactionFilters;
};

function getMetricValue(
  stats: FilteredTransactionValueStats,
  metric: ValueStatMetric,
): string | null {
  if (stats.count === 0) {
    return null;
  }

  switch (metric) {
    case 'sum':
      return stats.sum;
    case 'avg':
      return stats.avg;
    case 'min':
      return stats.min;
    case 'max':
      return stats.max;
  }
}

function serializeFilters(filters: TransactionFilters): string {
  return JSON.stringify(filters);
}

export function TransactionsFilterValueStat({
  filters,
}: TransactionsFilterValueStatProps) {
  const [metric, setMetric] = useState<ValueStatMetric>('sum');
  const [stats, setStats] = useState<FilteredTransactionValueStats | null>(
    null,
  );
  const [loadedFiltersKey, setLoadedFiltersKey] = useState<string | null>(
    null,
  );
  const fetchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const requestIdRef = useRef(0);
  const filtersKey = useMemo(() => serializeFilters(filters), [filters]);
  const isLoading = loadedFiltersKey !== filtersKey;

  useEffect(() => {
    if (fetchDebounceRef.current) {
      clearTimeout(fetchDebounceRef.current);
    }

    fetchDebounceRef.current = setTimeout(() => {
      const requestId = ++requestIdRef.current;

      void getFilteredTransactionValueStatsAction(filters).then((result) => {
        if (requestId !== requestIdRef.current) {
          return;
        }

        setStats(result.ok ? result.data : null);
        setLoadedFiltersKey(filtersKey);
      });
    }, FETCH_DEBOUNCE_MS);

    return () => {
      if (fetchDebounceRef.current) {
        clearTimeout(fetchDebounceRef.current);
      }
    };
  }, [filters, filtersKey]);

  const selectedValue = stats ? getMetricValue(stats, metric) : null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className="max-w-44 font-normal sm:max-w-none"
          aria-label="Filtered transaction value statistics"
        >
          {isLoading ? (
            <>
              <Loader2Icon className="animate-spin" />
              <span className="truncate">{METRIC_LABELS[metric]}</span>
            </>
          ) : (
            <>
              <span className="truncate text-muted-foreground">
                {METRIC_LABELS[metric]}
              </span>
              <span
                className={cn(
                  'truncate font-mono tabular-nums',
                  getMoneyValueColorClass(selectedValue),
                )}
              >
                {formatDisplayMoney(selectedValue)}
              </span>
            </>
          )}
          <ChevronDownIcon className="shrink-0 text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-52">
        <DropdownMenuLabel>Filtered values</DropdownMenuLabel>
        <DropdownMenuRadioGroup
          value={metric}
          onValueChange={(value) => setMetric(value as ValueStatMetric)}
        >
          {(Object.keys(METRIC_LABELS) as ValueStatMetric[]).map((key) => {
            const value = stats ? getMetricValue(stats, key) : null;

            return (
              <DropdownMenuRadioItem
                key={key}
                value={key}
                className="justify-between gap-3"
              >
                <span>{METRIC_LABELS[key]}</span>
                <span
                  className={cn(
                    'font-mono text-xs tabular-nums',
                    isLoading
                      ? 'text-muted-foreground'
                      : getMoneyValueColorClass(value),
                  )}
                >
                  {isLoading ? '…' : formatDisplayMoney(value)}
                </span>
              </DropdownMenuRadioItem>
            );
          })}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
