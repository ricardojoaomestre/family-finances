'use client';

import {
  ArrowDownLeftIcon,
  ArrowUpRightIcon,
  ScaleIcon,
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

type SpendingCategoryDeltaRowProps = {
  label: string;
  delta: DashboardSpendingCategoryDelta | null;
};

function SpendingCategoryDeltaRow({
  label,
  delta,
}: SpendingCategoryDeltaRowProps) {
  return (
    <div className="flex min-w-0 items-center gap-2.5">
      <div className="flex min-w-0 flex-1 items-center gap-2.5">
        {delta ? (
          <>
            <CategoryIcon
              icon={delta.categoryIcon ?? 'tag'}
              color={delta.categoryColor ?? 'amber-200'}
              className="size-9 shrink-0 rounded-xl [&_svg]:size-4"
            />
            <div className="min-w-0">
              <p className="text-[11px] font-medium text-muted-foreground">
                {label}
              </p>
              <p className="truncate text-sm font-semibold tracking-tight text-foreground">
                {delta.categoryName}
              </p>
            </div>
          </>
        ) : (
          <div className="min-w-0">
            <p className="text-[11px] font-medium text-muted-foreground">
              {label}
            </p>
            <p className="text-sm font-medium text-muted-foreground">—</p>
          </div>
        )}
      </div>
      {delta ? (
        <TextStatWidget.Trend
          trend={delta.trend}
          invertColors
          className="shrink-0"
        />
      ) : null}
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
  const spendingChangesLabel = hasSpendingDeltas
    ? [
        spendingDeltas?.increase
          ? `Biggest increase: ${spendingDeltas.increase.categoryName}`
          : null,
        spendingDeltas?.decrease
          ? `Biggest decrease: ${spendingDeltas.decrease.categoryName}`
          : null,
      ]
        .filter(Boolean)
        .join(', ')
    : 'Spending changes';

  if (isLoading) {
    return (
      <div
        className={cn(
          'grid grid-cols-1 gap-3 md:grid-cols-2 md:gap-4 xl:grid-cols-5',
          className,
        )}
      >
        <TextStatWidget.Skeleton />
        <TextStatWidget.Skeleton />
        <TextStatWidget.Skeleton />
        <TextStatWidget.Skeleton />
        <TextStatWidget.Skeleton />
      </div>
    );
  }

  return (
    <div
      className={cn(
        'grid grid-cols-1 gap-3 md:grid-cols-2 md:gap-4 xl:grid-cols-5',
        className,
      )}
    >
      <TextStatWidget label="Income" className={cn(widgetAnimationClasses[0])}>
        <TextStatWidget.Header>
          <TextStatWidget.Icon icon={ArrowUpRightIcon} />
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

      <TextStatWidget label="Expenses" className={cn(widgetAnimationClasses[1])}>
        <TextStatWidget.Header>
          <TextStatWidget.Icon icon={ArrowDownLeftIcon} />
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
        className={cn(widgetAnimationClasses[2])}
      >
        <TextStatWidget.Header>
          <TextStatWidget.Icon icon={ScaleIcon} />
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
        className={cn(widgetAnimationClasses[3])}
      >
        <TextStatWidget.Header>
          <TextStatWidget.Heading>
            <TextStatWidget.Title>Top spending category</TextStatWidget.Title>
          </TextStatWidget.Heading>
        </TextStatWidget.Header>
        <TextStatWidget.Body>
          {topSpending ? (
            <div className="flex items-center gap-3">
              <CategoryIcon
                icon={topSpending.categoryIcon ?? 'tag'}
                color={topSpending.categoryColor ?? 'amber-200'}
                className="size-12 rounded-2xl [&_svg]:size-6"
              />
              <p className="min-w-0 truncate text-lg font-semibold tracking-tight text-foreground md:text-xl">
                {topSpending.categoryName}
              </p>
            </div>
          ) : (
            <p className="text-lg font-medium text-muted-foreground">—</p>
          )}
        </TextStatWidget.Body>
        <TextStatWidget.Footer>
          <TextStatWidget.Value
            value={topSpending?.total ?? null}
            size="sm"
            className="text-destructive"
          />
        </TextStatWidget.Footer>
      </TextStatWidget>

      <TextStatWidget
        label={spendingChangesLabel}
        className={cn(widgetAnimationClasses[4])}
      >
        <TextStatWidget.Header>
          <TextStatWidget.Heading>
            <TextStatWidget.Title>Spending changes</TextStatWidget.Title>
          </TextStatWidget.Heading>
        </TextStatWidget.Header>
        <TextStatWidget.Body>
          {hasSpendingDeltas ? (
            <div className="flex flex-col gap-3 md:gap-0 md:divide-y md:divide-border/60">
              <SpendingCategoryDeltaRow
                label="Biggest increase"
                delta={spendingDeltas.increase}
              />
              <div className="md:pt-3">
                <SpendingCategoryDeltaRow
                  label="Biggest decrease"
                  delta={spendingDeltas.decrease}
                />
              </div>
            </div>
          ) : (
            <p className="text-lg font-medium text-muted-foreground">—</p>
          )}
        </TextStatWidget.Body>
        <TextStatWidget.Footer>
          <TextStatWidget.ComparisonLabel>
            {comparisonSuffix}
          </TextStatWidget.ComparisonLabel>
        </TextStatWidget.Footer>
      </TextStatWidget>
    </div>
  );
}
