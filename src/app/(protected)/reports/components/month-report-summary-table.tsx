import {
  TableMoneyCell,
} from '@/components/data-table/table-money-cell';
import {
  Table,
  TableBody,
  TableCell,
  TableRow,
} from '@/components/ui/table';

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
      <div>
        <h2 className="text-lg font-semibold">Summary</h2>
      </div>
      <Table>
        <TableBody>
          {summaryRows.map((row) => (
            <TableRow key={row.key}>
              <TableCell className="font-medium">{row.label}</TableCell>
              <TableCell className="text-right">
                <TableMoneyCell value={values[row.valueKey]} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </section>
  );
}
