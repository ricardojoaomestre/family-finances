'use client';

import {
  ArrowDownLeftIcon,
  ArrowUpRightIcon,
  ScaleIcon,
} from 'lucide-react';

import { TextStatWidget } from '@/components/text-stat-widget/text-stat-widget';
import { computeMonthOverMonthTrend } from '@/lib/dashboard/compute-month-over-month-trend';
import { formatDashboardExpenseTotal } from '@/lib/dashboard/compute-dashboard-net-worth';
import type { DashboardMonthStats } from '@/lib/dashboard/dashboard-month-stats';
import { formatPreviousCalendarMonth } from '@/lib/reports/report-month';
import { cn } from '@/lib/utils';

type DashboardStatsGridProps = {
  stats: DashboardMonthStats;
  monthDateFrom: string;
  isLoading?: boolean;
  className?: string;
};

const widgetAnimationClasses = [
  'animate-in fade-in slide-in-from-bottom-4 fill-mode-both duration-700',
  '[animation-delay:100ms]',
  '[animation-delay:200ms]',
] as const;

export function DashboardStatsGrid({
  stats,
  monthDateFrom,
  isLoading = false,
  className,
}: DashboardStatsGridProps) {
  const previousMonthLabel = formatPreviousCalendarMonth(monthDateFrom);
  const comparisonSuffix = previousMonthLabel
    ? `vs ${previousMonthLabel}`
    : 'vs previous month';

  const incomeTrend = computeMonthOverMonthTrend(
    stats.income,
    stats.previousMonth?.income,
  );
  const expenseDisplay = formatDashboardExpenseTotal(stats.expenses);
  const previousExpenseDisplay = stats.previousMonth
    ? formatDashboardExpenseTotal(stats.previousMonth.expenses)
    : null;
  const expenseTrend = computeMonthOverMonthTrend(
    expenseDisplay,
    previousExpenseDisplay,
  );
  const netTrend = computeMonthOverMonthTrend(
    stats.netWorth,
    stats.previousMonth?.netWorth,
  );

  if (isLoading) {
    return (
      <div
        className={cn(
          'grid grid-cols-1 gap-3 md:grid-cols-2 md:gap-4 xl:grid-cols-3',
          className,
        )}
      >
        <TextStatWidget.Skeleton />
        <TextStatWidget.Skeleton />
        <TextStatWidget.Skeleton className="md:col-span-2 xl:col-span-1" />
      </div>
    );
  }

  return (
    <div
      className={cn(
        'grid grid-cols-1 gap-3 md:grid-cols-2 md:gap-4 xl:grid-cols-3',
        className,
      )}
    >
      <TextStatWidget label="Income" className={cn(widgetAnimationClasses[0])}>
        <TextStatWidget.Header>
          <TextStatWidget.Heading>
            <TextStatWidget.Title>Income</TextStatWidget.Title>
            <TextStatWidget.Description>Money in this month</TextStatWidget.Description>
          </TextStatWidget.Heading>
          <TextStatWidget.Icon icon={ArrowUpRightIcon} />
        </TextStatWidget.Header>
        <TextStatWidget.Body>
          <TextStatWidget.Value value={stats.income} colorize />
        </TextStatWidget.Body>
        <TextStatWidget.Footer>
          <TextStatWidget.Trend trend={incomeTrend} />
          <TextStatWidget.ComparisonLabel>
            {comparisonSuffix}
          </TextStatWidget.ComparisonLabel>
        </TextStatWidget.Footer>
      </TextStatWidget>

      <TextStatWidget label="Expenses" className={cn(widgetAnimationClasses[1])}>
        <TextStatWidget.Header>
          <TextStatWidget.Heading>
            <TextStatWidget.Title>Expenses</TextStatWidget.Title>
            <TextStatWidget.Description>Spending this month</TextStatWidget.Description>
          </TextStatWidget.Heading>
          <TextStatWidget.Icon icon={ArrowDownLeftIcon} />
        </TextStatWidget.Header>
        <TextStatWidget.Body>
          <TextStatWidget.Value
            value={expenseDisplay}
            className="text-destructive"
          />
        </TextStatWidget.Body>
        <TextStatWidget.Footer>
          <TextStatWidget.Trend trend={expenseTrend} invertColors />
          <TextStatWidget.ComparisonLabel>
            {comparisonSuffix}
          </TextStatWidget.ComparisonLabel>
        </TextStatWidget.Footer>
      </TextStatWidget>

      <TextStatWidget
        label="Net worth"
        className={cn(
          widgetAnimationClasses[2],
          'md:col-span-2 xl:col-span-1',
        )}
      >
        <TextStatWidget.Header>
          <TextStatWidget.Heading>
            <TextStatWidget.Title>Net worth</TextStatWidget.Title>
            <TextStatWidget.Description>Income minus expenses</TextStatWidget.Description>
          </TextStatWidget.Heading>
          <TextStatWidget.Icon icon={ScaleIcon} />
        </TextStatWidget.Header>
        <TextStatWidget.Body>
          <TextStatWidget.Value value={stats.netWorth} colorize />
        </TextStatWidget.Body>
        <TextStatWidget.Footer>
          <TextStatWidget.Trend trend={netTrend} />
          <TextStatWidget.ComparisonLabel>
            {comparisonSuffix}
          </TextStatWidget.ComparisonLabel>
        </TextStatWidget.Footer>
      </TextStatWidget>
    </div>
  );
}
