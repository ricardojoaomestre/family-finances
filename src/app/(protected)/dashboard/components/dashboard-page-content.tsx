'use client';

import { useRouter } from 'next/navigation';
import { useTransition } from 'react';

import { SetPageHeader } from '@/app/(protected)/components/protected-page-context';
import { DashboardBudgetProgress } from '@/app/(protected)/dashboard/components/dashboard-budget-progress';
import { DashboardCategorySpendingChart } from '@/app/(protected)/dashboard/components/dashboard-category-spending-chart';
import { DashboardMonthPicker } from '@/app/(protected)/dashboard/components/dashboard-month-picker';
import { DashboardStatsGrid } from '@/app/(protected)/dashboard/components/dashboard-stats-grid';
import {
  type DashboardMonthRange,
} from '@/lib/dashboard/dashboard-date-range';
import type { DashboardMonthStats } from '@/lib/dashboard/dashboard-month-stats';
import type { CategoryMonthlySpendingRow } from '@/lib/dashboard/dashboard-category-chart-months';
import type { CategoryOption } from '@/lib/categories/to-category-options';
import type { CategoryBudgetProgressRow } from '@/lib/budgets/get-category-budget-progress';
import { buildMonthReportSearchParams } from '@/lib/reports/month-report-search-params';

type DashboardPageContentProps = {
  welcomeMessage: string;
  monthRange: DashboardMonthRange;
  stats: DashboardMonthStats;
  spendingCategories: CategoryOption[];
  categoryMonthlySpending: CategoryMonthlySpendingRow[];
  budgetProgress: CategoryBudgetProgressRow[];
};

export function DashboardPageContent({
  welcomeMessage,
  monthRange,
  stats,
  spendingCategories,
  categoryMonthlySpending,
  budgetProgress,
}: DashboardPageContentProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleMonthChange(nextRange: DashboardMonthRange) {
    startTransition(() => {
      router.push(
        `/dashboard${buildMonthReportSearchParams(
          { dateFrom: monthRange.dateFrom, dateTo: monthRange.dateTo },
          nextRange,
        )}`,
      );
    });
  }

  return (
    <>
      <SetPageHeader
        description={welcomeMessage}
        actions={
          <DashboardMonthPicker
            value={monthRange}
            onValueChange={handleMonthChange}
          />
        }
      />
      <div className="flex flex-1 flex-col gap-6 p-4 sm:p-6">
        <DashboardStatsGrid
          key={`${monthRange.dateFrom}-${monthRange.dateTo}`}
          stats={stats}
          monthDateFrom={monthRange.dateFrom}
          isLoading={isPending}
        />
        <DashboardCategorySpendingChart
          key={`${monthRange.dateFrom}-${monthRange.dateTo}-chart`}
          monthDateFrom={monthRange.dateFrom}
          categories={spendingCategories}
          monthlySpending={categoryMonthlySpending}
          topSpendingCategory={stats.topSpendingCategory}
          isLoading={isPending}
        />
        <DashboardBudgetProgress
          key={`${monthRange.dateFrom}-${monthRange.dateTo}-budgets`}
          rows={budgetProgress}
          isLoading={isPending}
        />
      </div>
    </>
  );
}
