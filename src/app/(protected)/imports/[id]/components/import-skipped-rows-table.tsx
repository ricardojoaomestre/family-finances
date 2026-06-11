'use client';

import type { ColumnDef } from '@tanstack/react-table';
import { Check, Pencil } from 'lucide-react';

import { ImportDataTable } from '@/app/(protected)/dashboard/components/import-data-table';
import {
  TABLE_MONEY_HEADER_CLASS,
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

function SkippedRowReasonBadge({
  reason,
  errors,
}: Pick<ImportSkippedRow, 'reason' | 'errors'>) {
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
        {duplicateReason ? getDuplicateTooltipMessage(duplicateReason) : null}
      </TooltipContent>
    </Tooltip>
  );
}

function SkippedRowActions({
  skippedRow,
  onImport,
  onEdit,
  isImporting,
}: {
  skippedRow: ImportSkippedRow;
  onImport: (row: ImportSkippedRow) => void;
  onEdit: (row: ImportSkippedRow) => void;
  isImporting: boolean;
}) {
  const showImport = isDuplicateSkippedReason(skippedRow.reason);

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
}

function createReasonColumn(): ColumnDef<ImportSkippedRow> {
  return {
    id: 'reason',
    header: 'Validation',
    cell: ({ row }) => (
      <SkippedRowReasonBadge
        reason={row.original.reason}
        errors={row.original.errors}
      />
    ),
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
    cell: ({ row }) => (
      <SkippedRowActions
        skippedRow={row.original}
        onImport={onImport}
        onEdit={onEdit}
        isImporting={isImportingId === row.original.id}
      />
    ),
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
      header: () => <div className={TABLE_MONEY_HEADER_CLASS}>Value</div>,
      cell: ({ row }) => <TableMoneyCell value={row.getValue('value')} />,
    },
  ];

  if (includeBalance) {
    columns.push({
      accessorKey: 'balance',
      header: () => <div className={TABLE_MONEY_HEADER_CLASS}>Balance</div>,
      cell: ({ row }) => <TableMoneyCell value={row.getValue('balance')} />,
      meta: {
        headerClassName: 'hidden lg:table-cell',
        cellClassName: 'hidden lg:table-cell',
      },
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
      renderMobileCard={({ original: skippedRow }) => (
        <div className="flex flex-col gap-2">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium whitespace-normal">
                {skippedRow.description}
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {formatDisplayDate(skippedRow.date)}
              </p>
            </div>
            <div className="flex shrink-0 flex-col items-end gap-0.5">
              <TableMoneyCell value={skippedRow.value} />
              {skippedRow.balance != null ? (
                <div className="flex items-baseline gap-1 text-xs text-muted-foreground">
                  <span>Balance:</span>
                  <TableMoneyCell
                    value={skippedRow.balance}
                    className="text-xs"
                  />
                </div>
              ) : null}
            </div>
          </div>
          <div className="flex items-center justify-between gap-3">
            <SkippedRowReasonBadge
              reason={skippedRow.reason}
              errors={skippedRow.errors}
            />
            <SkippedRowActions
              skippedRow={skippedRow}
              onImport={onImport}
              onEdit={onEdit}
              isImporting={isImportingId === skippedRow.id}
            />
          </div>
        </div>
      )}
    />
  );
}
