'use client';

import { useMemo, useState } from 'react';
import { CalendarIcon } from 'lucide-react';
import type { Matcher } from 'react-day-picker';

import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  endOfTodayUtc,
  parseCalendarDayKey,
} from '@/lib/dates/calendar-day-key';
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

  const selectedMonth = useMemo(() => parseCalendarDayKey(value.dateFrom), [value.dateFrom]);

  const disabledDays: Matcher | undefined = disableFuture
    ? { after: endOfTodayUtc() }
    : undefined;

  const label = value.dateFrom ? formatReportMonth(value.dateFrom) : placeholder;

  return (
    <Popover open={open} onOpenChange={setOpen}>
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
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          captionLayout="dropdown"
          selected={selectedMonth}
          disabled={disabledDays}
          defaultMonth={selectedMonth}
          onSelect={(date) => {
            if (!date) {
              onValueChange({ dateFrom: '', dateTo: '' });
              return;
            }

            const bounds = getReportMonthBounds(
              date.getFullYear(),
              date.getMonth() + 1,
            );

            onValueChange(bounds);
            setOpen(false);
          }}
        />
      </PopoverContent>
    </Popover>
  );
}
