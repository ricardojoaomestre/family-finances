'use client';

import { useMemo, useState } from 'react';
import { CalendarIcon, ChevronLeftIcon, ChevronRightIcon } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { parseCalendarDayKey } from '@/lib/dates/calendar-day-key';
import { formatReportMonth, getReportMonthBounds } from '@/lib/reports/report-month';
import { cn } from '@/lib/utils';

type MonthPickerValue = {
  dateFrom: string;
  dateTo: string;
};

type MonthPickerProps = {
  id?: string;
  value: MonthPickerValue;
  onValueChange: (value: MonthPickerValue) => void;
  placeholder?: string;
  disabled?: boolean;
  disableFuture?: boolean;
  className?: string;
  'aria-invalid'?: boolean;
};

const monthLabels = Array.from({ length: 12 }, (_, monthIndex) =>
  new Intl.DateTimeFormat('en-GB', { month: 'short' }).format(
    new Date(2024, monthIndex, 1),
  ),
);

function isMonthDisabled(
  year: number,
  month: number,
  disableFuture: boolean,
): boolean {
  if (!disableFuture) {
    return false;
  }

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;

  return year > currentYear || (year === currentYear && month > currentMonth);
}

export function MonthPicker({
  id,
  value,
  onValueChange,
  placeholder = 'Pick a month',
  disabled = false,
  disableFuture = false,
  className,
  'aria-invalid': ariaInvalid,
}: MonthPickerProps) {
  const [open, setOpen] = useState(false);

  const selectedMonth = useMemo(
    () => parseCalendarDayKey(value.dateFrom),
    [value.dateFrom],
  );

  const [viewYear, setViewYear] = useState(() => {
    return selectedMonth?.getFullYear() ?? new Date().getFullYear();
  });

  const currentYear = new Date().getFullYear();
  const canGoToNextYear = !disableFuture || viewYear < currentYear;

  const label = value.dateFrom ? formatReportMonth(value.dateFrom) : placeholder;

  return (
    <Popover
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen);

        if (nextOpen) {
          setViewYear(selectedMonth?.getFullYear() ?? currentYear);
        }
      }}
    >
      <PopoverTrigger asChild>
        <Button
          id={id}
          type="button"
          variant="outline"
          disabled={disabled}
          aria-invalid={ariaInvalid}
          className={cn(
            'h-9 min-w-[220px] justify-start gap-2 rounded-3xl border border-transparent bg-input/50 px-3 py-2 font-normal shadow-none hover:bg-input/50',
            !value.dateFrom && 'text-muted-foreground',
            className,
          )}
        >
          <CalendarIcon className="opacity-50" />
          <span className="truncate">{label}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-3" align="start">
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between gap-2">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-8"
              aria-label="Previous year"
              onClick={() => setViewYear((year) => year - 1)}
            >
              <ChevronLeftIcon className="size-4" />
            </Button>
            <span className="min-w-16 text-center text-sm font-medium">
              {viewYear}
            </span>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-8"
              disabled={!canGoToNextYear}
              aria-label="Next year"
              onClick={() => setViewYear((year) => year + 1)}
            >
              <ChevronRightIcon className="size-4" />
            </Button>
          </div>
          <div
            role="grid"
            aria-label={`Select a month in ${viewYear}`}
            className="grid grid-cols-3 gap-1"
          >
            {monthLabels.map((monthLabel, monthIndex) => {
              const month = monthIndex + 1;
              const bounds = getReportMonthBounds(viewYear, month);
              const isSelected =
                value.dateFrom === bounds.dateFrom &&
                value.dateTo === bounds.dateTo;
              const monthDisabled = isMonthDisabled(
                viewYear,
                month,
                disableFuture,
              );

              return (
                <Button
                  key={month}
                  type="button"
                  variant="ghost"
                  role="gridcell"
                  disabled={monthDisabled}
                  aria-label={new Intl.DateTimeFormat('en-GB', {
                    month: 'long',
                    year: 'numeric',
                  }).format(new Date(viewYear, monthIndex, 1))}
                  aria-selected={isSelected}
                  className={cn(
                    'h-9 rounded-4xl text-sm font-normal',
                    isSelected &&
                      'bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground',
                  )}
                  onClick={() => {
                    onValueChange(bounds);
                    setOpen(false);
                  }}
                >
                  {monthLabel}
                </Button>
              );
            })}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
