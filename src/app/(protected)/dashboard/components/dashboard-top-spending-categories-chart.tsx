'use client';

import { PieChartIcon } from 'lucide-react';
import { Pie, PieChart } from 'recharts';

import {
  Card,
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
  EmptyTitle,
} from '@/components/ui/empty';
import { Skeleton } from '@/components/ui/skeleton';
import { getCategoryChartColorTheme } from '@/lib/categories/category-colors';
import type { DashboardTopSpendingCategory } from '@/lib/dashboard/dashboard-month-stats';
import { formatDisplayMoney } from '@/lib/formatters';
import { cn } from '@/lib/utils';

type DashboardTopSpendingCategoriesChartProps = {
  categories: DashboardTopSpendingCategory[];
  isLoading?: boolean;
  className?: string;
};

export function DashboardTopSpendingCategoriesChart({
  categories,
  isLoading = false,
  className,
}: DashboardTopSpendingCategoriesChartProps) {
  if (isLoading) {
    return (
      <Card className={cn('flex flex-col', className)}>
        <CardHeader>
          <CardTitle>Top spending categories</CardTitle>
          <CardDescription>Highest spend this month</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-1 items-center justify-center pb-6">
          <Skeleton className="size-55 rounded-full" />
        </CardContent>
      </Card>
    );
  }

  if (categories.length === 0) {
    return (
      <Card className={cn('flex flex-col', className)}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PieChartIcon className="size-4" />
            Top spending categories
          </CardTitle>
          <CardDescription>Highest spend this month</CardDescription>
        </CardHeader>
        <CardContent>
          <Empty className="border border-dashed">
            <EmptyHeader>
              <EmptyTitle>No spending this month</EmptyTitle>
              <EmptyDescription>
                Category totals will show up here once there are expenses.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        </CardContent>
      </Card>
    );
  }

  const chartData = categories.map((category) => ({
    key: category.key,
    categoryName: category.categoryName,
    amount: Number(category.amount),
    fill: `var(--color-${category.key})`,
  }));

  const chartConfig: ChartConfig = {
    amount: {
      label: 'Spent',
    },
    ...Object.fromEntries(
      categories.map((category) => [
        category.key,
        {
          label: category.categoryName,
          theme: getCategoryChartColorTheme(category.categoryColor),
        },
      ]),
    ),
  };

  return (
    <Card
      className={cn(
        'flex flex-col animate-in fade-in slide-in-from-bottom-4 fill-mode-both duration-700 [animation-delay:300ms]',
        className,
      )}
    >
      <CardHeader className="items-center pb-0">
        <CardTitle className="flex items-center gap-2">
          <PieChartIcon className="size-4" />
          Top spending categories
        </CardTitle>
        <CardDescription>
          Top {categories.length} highest spend{' '}
          {categories.length === 1 ? 'category' : 'categories'} this month
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-1 pb-0">
        <ChartContainer
          config={chartConfig}
          className="mx-auto aspect-square max-h-80 w-full pb-0 [&_.recharts-pie-label-text]:fill-foreground"
          initialDimension={{ width: 320, height: 320 }}
        >
          <PieChart>
            <ChartTooltip
              content={
                <ChartTooltipContent
                  hideLabel
                  nameKey="key"
                  formatter={(value, name) => {
                    const label =
                      chartConfig[String(name)]?.label ?? String(name);

                    return (
                      <>
                        <div
                          className="size-2.5 shrink-0 rounded-xs"
                          style={{
                            backgroundColor: `var(--color-${String(name)})`,
                          }}
                        />
                        <div className="flex flex-1 items-center justify-between gap-3 leading-none">
                          <span className="text-muted-foreground">{label}</span>
                          <span className="font-mono font-medium text-foreground tabular-nums">
                            {formatDisplayMoney(value as number)}
                          </span>
                        </div>
                      </>
                    );
                  }}
                />
              }
            />
            <Pie
              data={chartData}
              dataKey="amount"
              nameKey="key"
              label={({ payload }) =>
                String(payload?.categoryName ?? payload?.key ?? '')
              }
            />
          </PieChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
