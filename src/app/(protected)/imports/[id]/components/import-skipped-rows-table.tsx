'use client';

import type { ColumnDef } from '@tanstack/react-table';

import { ImportDataTable } from '@/app/(protected)/dashboard/components/import-data-table';
import {
  TABLE_MONEY_CELL_CLASS,
  TableMoneyCell,
} from '@/components/data-table/table-money-cell';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import type { ImportSkippedRowReason } from '@/db/schema';
import { getDuplicateTooltipMessage } from '@/lib/file-import';
import { formatDisplayDate } from '@/lib/formatters';

export type ImportSkippedRow = {
  id: string;
  rowIndex: number;
  date: Date | null;
  description: string;
  value: string | null;
  balance: string | null;
  reason: ImportSkippedRowReason;
  errors: string[] | null;
};

function getDuplicateReasonForTooltip(
  reason: ImportSkippedRowReason,
): 'inFile' | 'existing' | null {
  switch (reason) {
    case 'duplicate_in_file':
      return 'inFile';
    case 'duplicate_existing':
      return 'existing';
    default:
      return null;
  }
}

function createReasonColumn(): ColumnDef<ImportSkippedRow> {
  return {
    id: 'reason',
    header: 'Validation',
    cell: ({ row }) => {
      const { reason, errors } = row.original;

      if (reason === 'invalid') {
        return (
          <Tooltip>
            <TooltipTrigger asChild>
              <Badge variant="destructive" className="cursor-default">
                Invalid
              </Badge>
            </TooltipTrigger>
            <TooltipContent>
              <ul className="list-inside list-disc space-y-0.5">
                {(errors ?? []).map((error) => (
                  <li key={error}>{error}</li>
                ))}
              </ul>
            </TooltipContent>
          </Tooltip>
        );
      }

      const duplicateReason = getDuplicateReasonForTooltip(reason);

      return (
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge variant="warning" className="cursor-default">
              Duplicate
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            {duplicateReason
              ? getDuplicateTooltipMessage(duplicateReason)
              : null}
          </TooltipContent>
        </Tooltip>
      );
    },
  };
}

function createColumns(includeBalance: boolean): ColumnDef<ImportSkippedRow>[] {
  const columns: ColumnDef<ImportSkippedRow>[] = [
    createReasonColumn(),
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

type ImportSkippedRowsTableProps = {
  data: ImportSkippedRow[];
};

export function ImportSkippedRowsTable({ data }: ImportSkippedRowsTableProps) {
  const includeBalance = data.some((row) => row.balance != null);

  return (
    <ImportDataTable columns={createColumns(includeBalance)} data={data} />
  );
}
