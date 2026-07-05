'use client';

import { formatDisplayMoney, invertMoneySign } from '@/lib/formatters';
import { cn } from '@/lib/utils';

export const TABLE_MONEY_HEADER_CLASS = 'text-right';

export const TABLE_MONEY_CELL_CLASS =
  'text-right font-mono text-[13px] tabular-nums';

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

  return num < 0 ? 'text-destructive' : 'text-success';
}

type TableMoneyCellProps = {
  value: string | number | null | undefined;
  className?: string;
  invertSign?: boolean;
};

export function TableMoneyCell({
  value,
  className,
  invertSign = false,
}: TableMoneyCellProps) {
  const displayValue = invertSign ? invertMoneySign(value) : value;

  return (
    <div
      className={cn(
        TABLE_MONEY_CELL_CLASS,
        getMoneyValueColorClass(displayValue),
        className,
      )}
    >
      {formatDisplayMoney(displayValue)}
    </div>
  );
}
