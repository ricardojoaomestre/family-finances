'use client';

import { useMemo, useState } from 'react';
import { CalendarIcon } from 'lucide-react';
import type { DateRange } from 'react-day-picker';

import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  formatCalendarDayKey,
  parseCalendarDayKey,
} from '@/lib/dates/calendar-day-key';
import { formatDisplayDate } from '@/lib/formatters';
import { cn } from '@/lib/utils';

type DateRangeValue = {
  dateFrom: string;
  dateTo: string;
};

type DateRangePickerProps = {
  id?: string;
  value: DateRangeValue;
  onValueChange: (value: DateRangeValue) => void;
  placeholder?: string;
  disabled?: boolean;
  clearable?: boolean;
  className?: string;
  'aria-invalid'?: boolean;
};

function formatRangeLabel(dateFrom: string, dateTo: string): string | null {
  const from = parseCalendarDayKey(dateFrom);
  const to = parseCalendarDayKey(dateTo);

  if (from && to) {
    return `${formatDisplayDate(from)} – ${formatDisplayDate(to)}`;
  }

  if (from) {
    return `${formatDisplayDate(from)} – …`;
  }

  if (to) {
    return `… – ${formatDisplayDate(to)}`;
  }

  return null;
}

export function DateRangePicker({
  id,
  value,
  onValueChange,
  placeholder = 'Pick a date range',
  disabled = false,
  clearable = false,
  className,
  'aria-invalid': ariaInvalid,
}: DateRangePickerProps) {
  const [open, setOpen] = useState(false);

  const selected = useMemo<DateRange | undefined>(() => {
    const from = parseCalendarDayKey(value.dateFrom);
    const to = parseCalendarDayKey(value.dateTo);

    if (!from && !to) {
      return undefined;
    }

    return { from, to };
  }, [value.dateFrom, value.dateTo]);

  const label =
    formatRangeLabel(value.dateFrom, value.dateTo) ?? placeholder;

  const hasValue = Boolean(value.dateFrom || value.dateTo);

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
            !hasValue && 'text-muted-foreground',
            className,
          )}
        >
          <CalendarIcon className="opacity-50" />
          <span className="truncate">{label}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="range"
          numberOfMonths={2}
          showOutsideDays={false}
          resetOnSelect
          selected={selected}
          onSelect={(range) => {
            if (!range?.from) {
              onValueChange({ dateFrom: '', dateTo: '' });
              return;
            }

            const dateFrom = formatCalendarDayKey(range.from);
            const dateTo = formatCalendarDayKey(range.to);
            const pickingEnd = Boolean(value.dateFrom && !value.dateTo);

            if (pickingEnd) {
              onValueChange({
                dateFrom,
                dateTo: dateTo || dateFrom,
              });
              return;
            }

            onValueChange({ dateFrom, dateTo: '' });
          }}
        />
        {clearable && hasValue ? (
          <div className="flex justify-end border-t border-border/50 p-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                onValueChange({ dateFrom: '', dateTo: '' });
                setOpen(false);
              }}
            >
              Clear
            </Button>
          </div>
        ) : null}
      </PopoverContent>
    </Popover>
  );
}
