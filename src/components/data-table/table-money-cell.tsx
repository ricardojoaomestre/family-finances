'use client';

import { jetbrainsMono } from '@/lib/fonts';
import { formatDisplayMoney } from '@/lib/formatters';
import { cn } from '@/lib/utils';

export const TABLE_MONEY_CELL_CLASS = cn(
  'text-right tabular-nums',
  jetbrainsMono.className,
);

export function getMoneyValueColorClass(
  value: string | number | null | undefined,
): string | undefined {
  if (value === null || value === undefined) {
    return undefined;
  }

  const num = typeof value === 'string' ? Number(value) : value;

  if (!Number.isFinite(num) || num === 0) {
    return undefined;
  }

  return num < 0 ? 'text-red-400' : 'text-green-500';
}

type TableMoneyCellProps = {
  value: string | number | null | undefined;
  className?: string;
};

export function TableMoneyCell({ value, className }: TableMoneyCellProps) {
  return (
    <div
      className={cn(
        TABLE_MONEY_CELL_CLASS,
        getMoneyValueColorClass(value),
        className,
      )}
    >
      {formatDisplayMoney(value)}
    </div>
  );
}
