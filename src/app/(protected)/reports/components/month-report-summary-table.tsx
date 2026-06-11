import { getMoneyValueColorClass } from '@/components/data-table/table-money-cell';
import { Card, CardContent } from '@/components/ui/card';
import { formatDisplayMoney } from '@/lib/formatters';
import { cn } from '@/lib/utils';

type MonthReportSummaryTableProps = {
  totalIncome: string;
  totalSpending: string;
  bpiBalanceBeforeIncome: string | null;
};

const summaryRows = [
  { key: 'income', label: 'Total income', valueKey: 'totalIncome' as const },
  {
    key: 'spending',
    label: 'Total spending',
    valueKey: 'totalSpending' as const,
  },
  {
    key: 'balance',
    label: 'BPI balance before income',
    valueKey: 'bpiBalanceBeforeIncome' as const,
  },
] as const;

export function MonthReportSummaryTable({
  totalIncome,
  totalSpending,
  bpiBalanceBeforeIncome,
}: MonthReportSummaryTableProps) {
  const values = {
    totalIncome,
    totalSpending,
    bpiBalanceBeforeIncome,
  };

  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-lg font-semibold">Summary</h2>
      <div className="grid gap-3 sm:grid-cols-3 sm:gap-4">
        {summaryRows.map((row) => {
          const value = values[row.valueKey];

          return (
            <Card key={row.key} size="sm" className="rounded-xl shadow-xs">
              <CardContent className="flex flex-col gap-1.5">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  {row.label}
                </p>
                <p
                  className={cn(
                    'font-mono text-2xl font-semibold tracking-tight tabular-nums',
                    getMoneyValueColorClass(value),
                  )}
                >
                  {formatDisplayMoney(value)}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </section>
  );
}
