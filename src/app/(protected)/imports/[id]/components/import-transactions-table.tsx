'use client';

import type { ColumnDef } from '@tanstack/react-table';

import { ImportDataTable } from '@/app/(protected)/dashboard/components/import-data-table';
import {
  TABLE_MONEY_CELL_CLASS,
  TableMoneyCell,
} from '@/components/data-table/table-money-cell';
import { formatDisplayDate } from '@/lib/formatters';

export type ImportTransactionRow = {
  id: string;
  date: Date;
  description: string;
  categoryName: string | null;
  value: string;
  balance: string | null;
};

function createColumns(
  includeBalance: boolean,
): ColumnDef<ImportTransactionRow>[] {
  const columns: ColumnDef<ImportTransactionRow>[] = [
    {
      accessorKey: 'date',
      header: 'Date',
      cell: ({ row }) => formatDisplayDate(row.original.date),
    },
    {
      accessorKey: 'description',
      header: 'Description',
      cell: ({ row }) => (
        <span className="whitespace-normal">{row.getValue('description')}</span>
      ),
    },
    {
      accessorKey: 'categoryName',
      header: 'Category',
      cell: ({ row }) => row.original.categoryName ?? '—',
    },
    {
      accessorKey: 'value',
      header: () => <div className={TABLE_MONEY_CELL_CLASS}>Value</div>,
      cell: ({ row }) => <TableMoneyCell value={row.getValue('value')} />,
    },
  ];

  if (includeBalance) {
    columns.push({
      accessorKey: 'balance',
      header: () => <div className={TABLE_MONEY_CELL_CLASS}>Balance</div>,
      cell: ({ row }) => <TableMoneyCell value={row.getValue('balance')} />,
    });
  }

  return columns;
}

type ImportTransactionsTableProps = {
  data: ImportTransactionRow[];
};

export function ImportTransactionsTable({ data }: ImportTransactionsTableProps) {
  const includeBalance = data.some((row) => row.balance != null);

  return (
    <ImportDataTable columns={createColumns(includeBalance)} data={data} />
  );
}
