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
  formatCalendarDayKey,
  parseCalendarDayKey,
} from '@/lib/dates/calendar-day-key';
import { formatDisplayDate } from '@/lib/formatters';
import { cn } from '@/lib/utils';

type DatePickerProps = {
  id?: string;
  value: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  disableFuture?: boolean;
  className?: string;
  'aria-invalid'?: boolean;
};

export function DatePicker({
  id,
  value,
  onValueChange,
  placeholder = 'Pick a date',
  disabled = false,
  disableFuture = false,
  className,
  'aria-invalid': ariaInvalid,
}: DatePickerProps) {
  const [open, setOpen] = useState(false);
  const selected = useMemo(() => parseCalendarDayKey(value), [value]);

  const disabledDays: Matcher | undefined = disableFuture
    ? { after: endOfTodayUtc() }
    : undefined;

  const label = selected ? formatDisplayDate(selected) : placeholder;

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
            'h-9 w-full justify-start gap-2 rounded-3xl border border-transparent bg-input/50 px-3 py-2 font-normal shadow-none hover:bg-input/50',
            !selected && 'text-muted-foreground',
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
          selected={selected}
          disabled={disabledDays}
          onSelect={(date) => {
            onValueChange(formatCalendarDayKey(date));
            setOpen(false);
          }}
        />
      </PopoverContent>
    </Popover>
  );
}
