'use client';

import { useState } from 'react';

import { SetPageHeader } from '@/app/(protected)/components/protected-page-context';
import { DashboardMonthPicker } from '@/app/(protected)/dashboard/components/dashboard-month-picker';
import {
  getDefaultDashboardMonthRange,
  type DashboardMonthRange,
} from '@/lib/dashboard/dashboard-date-range';
import { formatDisplayDate } from '@/lib/formatters';
import { formatReportMonth } from '@/lib/reports/report-month';

type DashboardPageContentProps = {
  welcomeMessage: string;
};

export function DashboardPageContent({
  welcomeMessage,
}: DashboardPageContentProps) {
  const [monthRange, setMonthRange] = useState<DashboardMonthRange>(() =>
    getDefaultDashboardMonthRange(),
  );

  return (
    <>
      <SetPageHeader
        description={welcomeMessage}
        actions={
          <DashboardMonthPicker
            value={monthRange}
            onValueChange={setMonthRange}
          />
        }
      />
      <div className="flex flex-1 flex-col gap-6 p-4 sm:p-6">
        <p className="text-sm text-muted-foreground">
          Month: {formatReportMonth(monthRange.dateFrom)} (
          {formatDisplayDate(monthRange.dateFrom)} –{' '}
          {formatDisplayDate(monthRange.dateTo)})
        </p>
      </div>
    </>
  );
}
