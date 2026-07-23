'use client';

import { useRouter } from 'next/navigation';
import { useTransition } from 'react';

import { SetPageHeader } from '@/app/(protected)/components/protected-page-context';
import { DashboardMonthPicker } from '@/app/(protected)/dashboard/components/dashboard-month-picker';
import { DashboardStatsGrid } from '@/app/(protected)/dashboard/components/dashboard-stats-grid';
import { type DashboardMonthRange } from '@/lib/dashboard/dashboard-date-range';
import type { DashboardMonthStats } from '@/lib/dashboard/dashboard-month-stats';
import { buildMonthReportSearchParams } from '@/lib/reports/month-report-search-params';

type DashboardPageContentProps = {
  welcomeMessage: string;
  monthRange: DashboardMonthRange;
  stats: DashboardMonthStats;
};

export function DashboardPageContent({
  welcomeMessage,
  monthRange,
  stats,
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
      </div>
    </>
  );
}
