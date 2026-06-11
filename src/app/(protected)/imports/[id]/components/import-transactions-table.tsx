'use client';

import type { ColumnDef, RowSelectionState } from '@tanstack/react-table';
import { useCallback, useMemo, useState } from 'react';

import { ImportDataTable } from '@/app/(protected)/dashboard/components/import-data-table';
import {
  TABLE_MONEY_HEADER_CLASS,
  TableMoneyCell,
} from '@/components/data-table/table-money-cell';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
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
      meta: {
        headerClassName: 'hidden md:table-cell',
        cellClassName: 'hidden md:table-cell',
      },
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

  return columns;
}

type ImportTransactionsTableProps = {
  data: ImportTransactionRow[];
  isDeleting?: boolean;
  onDeleteSelected: (transactionIds: string[]) => Promise<boolean>;
};

export function ImportTransactionsTable({
  data,
  isDeleting = false,
  onDeleteSelected,
}: ImportTransactionsTableProps) {
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [selectAllInImport, setSelectAllInImport] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const clearSelection = useCallback(() => {
    setSelectAllInImport(false);
    setRowSelection({});
  }, []);

  const selectedIds = useMemo(() => {
    if (selectAllInImport) {
      return data.map((row) => row.id);
    }

    return Object.keys(rowSelection).filter((id) => rowSelection[id]);
  }, [data, rowSelection, selectAllInImport]);

  const selectedCount = selectedIds.length;

  const handleDeleteConfirm = async () => {
    const deleted = await onDeleteSelected(selectedIds);

    if (deleted) {
      clearSelection();
      setDeleteDialogOpen(false);
    }
  };

  const includeBalance = data.some((row) => row.balance != null);

  return (
    <div className="flex flex-col gap-3">
      {selectedCount > 0 ? (
        <div className="flex flex-wrap items-center gap-3 rounded-md border bg-muted/50 px-4 py-2 text-sm">
          <span className="font-medium">
            {selectedCount} selected
          </span>
          <Button
            type="button"
            variant="destructive"
            size="sm"
            disabled={isDeleting}
            onClick={() => setDeleteDialogOpen(true)}
          >
            Delete
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={isDeleting}
            onClick={clearSelection}
          >
            Clear selection
          </Button>
        </div>
      ) : null}

      <ImportDataTable
        columns={createColumns(includeBalance)}
        data={data}
        enableRowSelection
        getRowId={(row) => row.id}
        rowSelection={rowSelection}
        onRowSelectionChange={setRowSelection}
        selectAllInDataset={selectAllInImport}
        onSelectAllInDatasetChange={setSelectAllInImport}
        selectAllBannerLabel="in this import"
      />

      <AlertDialog
        open={deleteDialogOpen}
        onOpenChange={(open) => {
          if (!open) {
            setDeleteDialogOpen(false);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Delete {selectedCount === 1 ? 'transaction' : 'transactions'}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              {selectedCount === 1
                ? 'This transaction will be permanently removed from this import.'
                : `${selectedCount} transactions will be permanently removed from this import.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={isDeleting}
              className="bg-destructive text-white hover:bg-destructive/90"
              onClick={(event) => {
                event.preventDefault();
                handleDeleteConfirm();
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
