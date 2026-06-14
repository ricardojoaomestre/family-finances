'use client';

import { MonthPicker } from '@/components/ui/month-picker';
import type { DashboardMonthRange } from '@/lib/dashboard/dashboard-date-range';

type DashboardMonthPickerProps = {
  value: DashboardMonthRange;
  onValueChange: (value: DashboardMonthRange) => void;
};

export function DashboardMonthPicker({
  value,
  onValueChange,
}: DashboardMonthPickerProps) {
  return (
    <MonthPicker
      disableFuture
      value={value}
      onValueChange={onValueChange}
      className="h-8 min-w-[7.5rem] px-3 text-xs shadow-xs"
    />
  );
}
