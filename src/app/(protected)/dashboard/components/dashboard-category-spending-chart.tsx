'use client';

import { useMemo, useState } from 'react';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import { BarChart3Icon } from 'lucide-react';

import { CategoryCombobox } from '@/components/categories/category-combobox';
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart';
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty';
import { Skeleton } from '@/components/ui/skeleton';
import type { CategoryOption } from '@/lib/categories/to-category-options';
import {
  buildCategoryMonthlySpendingSeries,
  getDashboardCategoryChartMonthRanges,
  hasCategoryMonthlySpending,
  type CategoryMonthlySpendingRow,
} from '@/lib/dashboard/dashboard-category-chart-months';
import {
  resolveDashboardCategoryChartCategoryId,
  resolveDashboardCategoryChartDefaultId,
} from '@/lib/dashboard/resolve-dashboard-category-chart-default';
import type { DashboardTopSpendingCategory } from '@/lib/dashboard/dashboard-month-stats';
import { formatDisplayMoney } from '@/lib/formatters';
import { formatReportMonth } from '@/lib/reports/report-month';
import { UNCATEGORIZED_CATEGORY_VALUE } from '@/lib/transactions/validate-transaction-form';
import { cn } from '@/lib/utils';

const chartConfig = {
  spending: {
    label: 'Spending',
    color: 'var(--chart-1)',
  },
} satisfies ChartConfig;

type DashboardCategorySpendingChartProps = {
  monthDateFrom: string;
  categories: CategoryOption[];
  monthlySpending: CategoryMonthlySpendingRow[];
  topSpendingCategory: DashboardTopSpendingCategory | null;
  isLoading?: boolean;
  className?: string;
};

function formatChartAxisMoney(value: number) {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'EUR',
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(value);
}

export function DashboardCategorySpendingChart({
  monthDateFrom,
  categories,
  monthlySpending,
  topSpendingCategory,
  isLoading = false,
  className,
}: DashboardCategorySpendingChartProps) {
  const monthRanges = useMemo(
    () => getDashboardCategoryChartMonthRanges(monthDateFrom),
    [monthDateFrom],
  );

  const defaultCategoryId = useMemo(
    () =>
      resolveDashboardCategoryChartDefaultId(topSpendingCategory, categories),
    [categories, topSpendingCategory],
  );

  const [selectedCategoryId, setSelectedCategoryId] = useState(defaultCategoryId);

  const resolvedCategoryId = resolveDashboardCategoryChartCategoryId(
    selectedCategoryId,
  );

  const chartSeries = useMemo(
    () =>
      buildCategoryMonthlySpendingSeries(
        monthlySpending,
        resolvedCategoryId,
        monthRanges,
      ),
    [monthlySpending, monthRanges, resolvedCategoryId],
  );

  const hasSpendingData = hasCategoryMonthlySpending(chartSeries);

  const selectedCategoryName = useMemo(() => {
    if (selectedCategoryId === UNCATEGORIZED_CATEGORY_VALUE) {
      return 'Uncategorized';
    }

    return (
      categories.find((category) => category.id === selectedCategoryId)?.name ??
      'this category'
    );
  }, [categories, selectedCategoryId]);

  const categoryFilter = (className: string) => (
    <CategoryCombobox
      value={selectedCategoryId}
      onValueChange={setSelectedCategoryId}
      categories={categories}
      noneValue={UNCATEGORIZED_CATEGORY_VALUE}
      noneLabel="Uncategorized"
      placeholder="Select category"
      className={className}
      aria-label="Category"
    />
  );

  if (isLoading) {
    return (
      <Card
        className={cn(
          'rounded-4xl border border-border bg-card shadow-xs',
          className,
        )}
      >
        <CardHeader>
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-4 w-24" />
          <CardAction className="hidden w-full md:block md:min-w-64 md:max-w-md">
            <Skeleton className="h-10 w-full rounded-3xl" />
          </CardAction>
        </CardHeader>
        <CardContent className="flex flex-col gap-4 md:block">
          <Skeleton className="h-10 w-full rounded-3xl md:hidden" />
          <Skeleton className="h-[280px] w-full rounded-2xl" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card
      className={cn(
        'rounded-4xl border border-border bg-card shadow-xs',
        className,
      )}
    >
      <CardHeader>
        <CardTitle>Category spending</CardTitle>
        <CardDescription>Monthly totals</CardDescription>
        <CardAction className="hidden w-full md:block md:min-w-64 md:max-w-md">
          {categoryFilter('w-full min-w-64')}
        </CardAction>
      </CardHeader>
      <CardContent className="flex flex-col gap-4 md:block">
        <div className="w-full md:hidden">{categoryFilter('w-full')}</div>
        {hasSpendingData ? (
          <ChartContainer
            config={chartConfig}
            className="aspect-auto h-[280px] w-full"
          >
            <BarChart
              accessibilityLayer
              data={chartSeries}
              margin={{ left: 4, right: 4, top: 8 }}
            >
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="monthLabel"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                width={56}
                tickFormatter={formatChartAxisMoney}
              />
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    hideIndicator
                    formatter={(value) => formatDisplayMoney(Number(value))}
                    labelFormatter={(_, payload) => {
                      const monthDateFrom = payload?.[0]?.payload?.monthDateFrom;

                      return typeof monthDateFrom === 'string'
                        ? formatReportMonth(monthDateFrom)
                        : '';
                    }}
                  />
                }
              />
              <Bar
                dataKey="amount"
                fill="var(--color-spending)"
                radius={[8, 8, 0, 0]}
              />
            </BarChart>
          </ChartContainer>
        ) : (
          <Empty className="min-h-[280px] border border-dashed border-border/70 bg-muted/20">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <BarChart3Icon />
              </EmptyMedia>
              <EmptyTitle>No spending data</EmptyTitle>
              <EmptyDescription>
                No expenses were recorded for {selectedCategoryName} between{' '}
                {formatReportMonth(monthRanges[0]?.monthDateFrom ?? monthDateFrom)}{' '}
                and{' '}
                {formatReportMonth(
                  monthRanges[monthRanges.length - 1]?.monthDateFrom ??
                    monthDateFrom,
                )}
                .
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        )}
      </CardContent>
    </Card>
  );
}
