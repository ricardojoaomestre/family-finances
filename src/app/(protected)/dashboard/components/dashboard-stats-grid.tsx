'use client';

import {
  BadgeEuroIcon,
  BanknoteArrowDownIcon,
  BanknoteArrowUpIcon,
  DollarSignIcon,
  TrendingUpDownIcon,
} from 'lucide-react';

import { CategoryIcon } from '@/components/categories/category-icon';
import { TextStatWidget } from '@/components/text-stat-widget/text-stat-widget';
import { computeMonthOverMonthTrend } from '@/lib/dashboard/compute-month-over-month-trend';
import { formatDashboardExpenseTotal } from '@/lib/dashboard/compute-dashboard-net-worth';
import type { DashboardMonthStats, DashboardSpendingCategoryDelta } from '@/lib/dashboard/dashboard-month-stats';
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
  '[animation-delay:300ms]',
  '[animation-delay:400ms]',
] as const;

const statsGridClassName =
  'grid grid-cols-2 gap-3 md:gap-4 lg:grid-cols-6';

const incomeWidgetClassName = 'order-2 lg:order-1 lg:col-span-2';
const expensesWidgetClassName = 'order-3 lg:order-2 lg:col-span-2';
const netWorthWidgetClassName = 'order-1 col-span-2 lg:order-3 lg:col-span-2';
const topSpendingWidgetClassName = 'order-4 col-span-2 lg:col-span-3';
const spendingChangesWidgetClassName = 'order-5 col-span-2 lg:col-span-3';

type SpendingCategoryDeltaRowProps = {
  delta: DashboardSpendingCategoryDelta | null;
};

function SpendingCategoryDeltaRow({ delta }: SpendingCategoryDeltaRowProps) {
  if (!delta) {
    return <p className="text-sm font-medium text-muted-foreground">—</p>;
  }

  return (
    <div className="flex min-w-0 items-center gap-2.5">
      <CategoryIcon
        icon={delta.categoryIcon ?? 'tag'}
        color={delta.categoryColor ?? 'amber-200'}
        className="size-9 shrink-0 rounded-xl [&_svg]:size-4"
      />
      <p className="min-w-0 flex-1 truncate text-sm font-semibold tracking-tight text-foreground">
        {delta.categoryName}
      </p>
      <TextStatWidget.Trend
        trend={delta.trend}
        invertColors
        placement="inline"
        className="shrink-0"
      />
    </div>
  );
}

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
  const topSpending = stats.topSpendingCategory;
  const topSpendingLabel = topSpending
    ? `Top spending category: ${topSpending.categoryName}`
    : 'Top spending category';
  const spendingDeltas = stats.spendingCategoryDeltas;
  const hasSpendingDeltas =
    spendingDeltas !== null &&
    (spendingDeltas.increase !== null || spendingDeltas.decrease !== null);
  const spendingChangesSubtitle = previousMonthLabel
    ? `Biggest differences vs ${previousMonthLabel}`
    : 'Biggest differences vs previous month';

  if (isLoading) {
    return (
      <div className={cn(statsGridClassName, className)}>
        <TextStatWidget.Skeleton className={netWorthWidgetClassName} />
        <TextStatWidget.Skeleton className={incomeWidgetClassName} />
        <TextStatWidget.Skeleton className={expensesWidgetClassName} />
        <TextStatWidget.Skeleton className={topSpendingWidgetClassName} />
        <TextStatWidget.Skeleton className={spendingChangesWidgetClassName} />
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

      <TextStatWidget
        label={topSpendingLabel}
        className={cn(widgetAnimationClasses[3], topSpendingWidgetClassName)}
      >
        <TextStatWidget.Header>
          <TextStatWidget.Icon icon={DollarSignIcon} />
          <TextStatWidget.Heading>
            <TextStatWidget.Title>Top spending category</TextStatWidget.Title>
          </TextStatWidget.Heading>
        </TextStatWidget.Header>
        <TextStatWidget.Body>
          {topSpending ? (
            <div className="flex items-center justify-between gap-3">
              <div className="flex min-w-0 flex-1 items-center gap-2.5 md:gap-3">
                <CategoryIcon
                  icon={topSpending.categoryIcon ?? 'tag'}
                  color={topSpending.categoryColor ?? 'amber-200'}
                  className="size-9 shrink-0 rounded-xl [&_svg]:size-4 md:size-12 md:rounded-2xl md:[&_svg]:size-6"
                />
                <p className="min-w-0 truncate text-sm font-semibold tracking-tight text-foreground md:text-lg lg:text-xl">
                  {topSpending.categoryName}
                </p>
              </div>
              <TextStatWidget.Value
                value={topSpending.total}
                size="sm"
                className="shrink-0 text-destructive"
              />
            </div>
          ) : (
            <p className="text-sm font-medium text-muted-foreground md:text-lg">—</p>
          )}
        </TextStatWidget.Body>
      </TextStatWidget>

      <TextStatWidget
        label="Spending changes"
        className={cn(widgetAnimationClasses[4], spendingChangesWidgetClassName)}
      >
        <TextStatWidget.Header>
          <TextStatWidget.Icon icon={TrendingUpDownIcon} />
          <TextStatWidget.Heading>
            <TextStatWidget.Title>Spending changes</TextStatWidget.Title>
            <TextStatWidget.Description className="block">
              {spendingChangesSubtitle}
            </TextStatWidget.Description>
          </TextStatWidget.Heading>
        </TextStatWidget.Header>
        <TextStatWidget.Body>
          {hasSpendingDeltas ? (
            <div className="flex flex-col gap-4">
              <SpendingCategoryDeltaRow delta={spendingDeltas.increase} />
              <SpendingCategoryDeltaRow delta={spendingDeltas.decrease} />
            </div>
          ) : (
            <p className="text-lg font-medium text-muted-foreground">—</p>
          )}
        </TextStatWidget.Body>
      </TextStatWidget>
    </div>
  );
}
