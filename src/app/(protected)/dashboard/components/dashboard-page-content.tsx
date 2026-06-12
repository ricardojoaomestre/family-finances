'use client';

import { useMemo, useState } from 'react';

import { SetPageHeader } from '@/app/(protected)/components/protected-page-context';
import { DashboardDateRangeSelector } from '@/app/(protected)/dashboard/components/dashboard-date-range-selector';
import {
  DEFAULT_DASHBOARD_DATE_RANGE_PRESET,
  type DashboardDateRangePreset,
  getDashboardDateRange,
  getDashboardDateRangePresetLabel,
} from '@/lib/dashboard/dashboard-date-range';
import { formatDisplayDate } from '@/lib/formatters';

type DashboardPageContentProps = {
  welcomeMessage: string;
};

export function DashboardPageContent({
  welcomeMessage,
}: DashboardPageContentProps) {
  const [preset, setPreset] = useState<DashboardDateRangePreset>(
    DEFAULT_DASHBOARD_DATE_RANGE_PRESET,
  );

  const dateRange = useMemo(() => getDashboardDateRange(preset), [preset]);

  return (
    <>
      <SetPageHeader
        description={welcomeMessage}
        actions={
          <DashboardDateRangeSelector
            value={preset}
            onValueChange={setPreset}
          />
        }
      />
      <div className="flex flex-1 flex-col gap-6 p-4 sm:p-6">
        <p className="text-sm text-muted-foreground">
          Date range filter: {getDashboardDateRangePresetLabel(preset)} (
          {formatDisplayDate(dateRange.dateFrom)} –{' '}
          {formatDisplayDate(dateRange.dateTo)})
        </p>
      </div>
    </>
  );
}
