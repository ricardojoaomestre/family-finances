'use client';

import {
  BadgeEuroIcon,
  BanknoteArrowDownIcon,
  BanknoteArrowUpIcon,
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

const statsGridClassName =
  'grid grid-cols-2 gap-3 md:gap-4 lg:grid-cols-6';

const incomeWidgetClassName = 'order-2 lg:order-1 lg:col-span-2';
const expensesWidgetClassName = 'order-3 lg:order-2 lg:col-span-2';
const netWorthWidgetClassName = 'order-1 col-span-2 lg:order-3 lg:col-span-2';

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
      <div className={cn(statsGridClassName, className)}>
        <TextStatWidget.Skeleton className={netWorthWidgetClassName} />
        <TextStatWidget.Skeleton className={incomeWidgetClassName} />
        <TextStatWidget.Skeleton className={expensesWidgetClassName} />
      </div>
    );
  }

  return (
    <div className={cn(statsGridClassName, className)}>
      <TextStatWidget
        label="Income"
        className={cn(widgetAnimationClasses[0], incomeWidgetClassName)}
      >
        <TextStatWidget.Header>
          <TextStatWidget.Icon icon={BanknoteArrowUpIcon} />
          <TextStatWidget.Heading>
            <TextStatWidget.Title>Income</TextStatWidget.Title>
            <TextStatWidget.Description>Money in this month</TextStatWidget.Description>
          </TextStatWidget.Heading>
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

      <TextStatWidget
        label="Expenses"
        className={cn(widgetAnimationClasses[1], expensesWidgetClassName)}
      >
        <TextStatWidget.Header>
          <TextStatWidget.Icon icon={BanknoteArrowDownIcon} />
          <TextStatWidget.Heading>
            <TextStatWidget.Title>Expenses</TextStatWidget.Title>
            <TextStatWidget.Description>Spending this month</TextStatWidget.Description>
          </TextStatWidget.Heading>
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
        className={cn(widgetAnimationClasses[2], netWorthWidgetClassName)}
      >
        <TextStatWidget.Header>
          <TextStatWidget.Icon icon={BadgeEuroIcon} />
          <TextStatWidget.Heading>
            <TextStatWidget.Title>Net worth</TextStatWidget.Title>
            <TextStatWidget.Description>Income minus expenses</TextStatWidget.Description>
          </TextStatWidget.Heading>
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
