'use client';

import type { ColumnDef } from '@tanstack/react-table';
import { Check, Pencil } from 'lucide-react';

import { ImportDataTable } from '@/app/(protected)/dashboard/components/import-data-table';
import {
  TABLE_MONEY_CELL_CLASS,
  TableMoneyCell,
} from '@/components/data-table/table-money-cell';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import type { ImportSkippedRowReason } from '@/db/schema';
import { getDuplicateTooltipMessage } from '@/lib/file-import';
import {
  isDuplicateSkippedReason,
  isSkippedRowReadyToImport,
} from '@/lib/imports/classify-skipped-import-row';
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

      if (isSkippedRowReadyToImport(reason, errors)) {
        return (
          <Badge variant="secondary" className="cursor-default">
            Ready
          </Badge>
        );
      }

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

function createActionsColumn(
  onImport: (row: ImportSkippedRow) => void,
  onEdit: (row: ImportSkippedRow) => void,
  isImportingId: string | null,
): ColumnDef<ImportSkippedRow> {
  return {
    id: 'actions',
    header: () => <span className="sr-only">Actions</span>,
    cell: ({ row }) => {
      const skippedRow = row.original;
      const showImport = isDuplicateSkippedReason(skippedRow.reason);
      const isImporting = isImportingId === skippedRow.id;

      return (
        <div className="flex items-center justify-end gap-1">
          {showImport ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  size="icon-sm"
                  disabled={isImporting}
                  onClick={() => onImport(skippedRow)}
                  aria-label="Import row"
                >
                  <Check />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Import row</TooltipContent>
            </Tooltip>
          ) : null}

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="outline"
                size="icon-sm"
                onClick={() => onEdit(skippedRow)}
                aria-label="Edit row"
              >
                <Pencil />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Edit row</TooltipContent>
          </Tooltip>
        </div>
      );
    },
  };
}

function createColumns(
  includeBalance: boolean,
  onImport: (row: ImportSkippedRow) => void,
  onEdit: (row: ImportSkippedRow) => void,
  isImportingId: string | null,
): ColumnDef<ImportSkippedRow>[] {
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

  columns.push(createActionsColumn(onImport, onEdit, isImportingId));

  return columns;
}

type ImportSkippedRowsTableProps = {
  data: ImportSkippedRow[];
  onImport: (row: ImportSkippedRow) => void;
  onEdit: (row: ImportSkippedRow) => void;
  isImportingId: string | null;
};

export function ImportSkippedRowsTable({
  data,
  onImport,
  onEdit,
  isImportingId,
}: ImportSkippedRowsTableProps) {
  const includeBalance = data.some((row) => row.balance != null);

  return (
    <ImportDataTable
      columns={createColumns(includeBalance, onImport, onEdit, isImportingId)}
      data={data}
    />
  );
}
