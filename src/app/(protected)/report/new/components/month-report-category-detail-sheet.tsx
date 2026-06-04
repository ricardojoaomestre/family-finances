'use client';

import { useRouter } from 'next/navigation';
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  useTransition,
} from 'react';
import type { ColumnDef } from '@tanstack/react-table';

import { getMonthReportCategoryTransactionsAction } from '@/app/(protected)/report/new/actions/get-month-report-category-transactions';
import { getTransactionDetails } from '@/app/(protected)/transactions/actions/get-transaction-details';
import { updateTransaction } from '@/app/(protected)/transactions/actions/update-transaction';
import { TransactionDetailSheet } from '@/app/(protected)/transactions/components/transaction-detail-sheet';
import { TransactionFormSheet } from '@/app/(protected)/transactions/components/transaction-form-sheet';
import { ImportDataTable } from '@/app/(protected)/dashboard/components/import-data-table';
import { CategoryPill } from '@/components/categories/category-pill';
import { DataTableRowActions } from '@/components/data-table/row-actions';
import {
  TABLE_MONEY_CELL_CLASS,
  TableMoneyCell,
} from '@/components/data-table/table-money-cell';
import { DropdownMenuItem } from '@/components/ui/dropdown-menu';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { formatDisplayDate } from '@/lib/formatters';
import type { MonthReportCategoryTotal } from '@/lib/reports/get-month-report-category-totals';
import type { MonthReportCategoryTransactionRow } from '@/lib/reports/month-report-category-transaction-row';
import { transactionDetailsToRow } from '@/lib/transactions/transaction-details-to-row';
import type { TransactionRow } from '@/lib/transactions/transaction-row';

type CategoryOption = {
  id: string;
  name: string;
};

function createColumns({
  includeBalance,
  onViewDetails,
  onEdit,
}: {
  includeBalance: boolean;
  onViewDetails: (row: MonthReportCategoryTransactionRow) => void;
  onEdit: (row: MonthReportCategoryTransactionRow) => void;
}): ColumnDef<MonthReportCategoryTransactionRow>[] {
  const columns: ColumnDef<MonthReportCategoryTransactionRow>[] = [
    {
      accessorKey: 'date',
      header: 'Date',
      cell: ({ row }) => formatDisplayDate(new Date(row.original.date)),
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
      header: () => <div className={TABLE_MONEY_CELL_CLASS}>Amount</div>,
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

  columns.push({
    id: 'actions',
    header: () => <span className="sr-only">Actions</span>,
    meta: {
      headerClassName: 'w-12',
      cellClassName: 'w-12',
    },
    cell: ({ row }) => (
      <DataTableRowActions>
        <DropdownMenuItem onSelect={() => onViewDetails(row.original)}>
          View details
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => onEdit(row.original)}>
          Edit
        </DropdownMenuItem>
      </DataTableRowActions>
    ),
  });

  return columns;
}

type MonthReportCategoryDetailSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  dateFrom: string;
  dateTo: string;
  category: MonthReportCategoryTotal | null;
  categories: CategoryOption[];
};

function getCategoryTitle(category: MonthReportCategoryTotal): string {
  if (!category.categoryId) {
    return 'Uncategorized';
  }

  return category.categoryName ?? 'Category';
}

export function MonthReportCategoryDetailSheet({
  open,
  onOpenChange,
  dateFrom,
  dateTo,
  category,
  categories,
}: MonthReportCategoryDetailSheetProps) {
  const router = useRouter();
  const [rows, setRows] = useState<MonthReportCategoryTransactionRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [editError, setEditError] = useState<string | null>(null);
  const [detailsTransactionId, setDetailsTransactionId] = useState<
    string | null
  >(null);
  const [editingTransaction, setEditingTransaction] =
    useState<TransactionRow | null>(null);
  const [isPending, startTransition] = useTransition();

  const loadRows = useCallback(
    (targetCategory: MonthReportCategoryTotal) => {
      startTransition(async () => {
        const result = await getMonthReportCategoryTransactionsAction({
          dateFrom,
          dateTo,
          categoryId: targetCategory.categoryId,
        });

        if (!result.ok) {
          setRows([]);
          setError(result.error);
          return;
        }

        setRows(result.data);
        setError(null);
      });
    },
    [dateFrom, dateTo],
  );

  useEffect(() => {
    if (!open || !category) {
      return;
    }

    loadRows(category);
  }, [open, category, loadRows]);

  function handleSheetOpenChange(nextOpen: boolean) {
    if (!nextOpen) {
      setRows([]);
      setError(null);
      setEditError(null);
      setDetailsTransactionId(null);
      setEditingTransaction(null);
    }

    onOpenChange(nextOpen);
  }

  const handleViewDetails = useCallback(
    (row: MonthReportCategoryTransactionRow) => {
      setDetailsTransactionId(row.id);
    },
    [],
  );

  const handleEdit = useCallback(
    async (row: MonthReportCategoryTransactionRow) => {
      setEditError(null);

      const result = await getTransactionDetails(row.id);

      if (!result.ok) {
        setEditError(result.error);
        return;
      }

      setEditingTransaction(transactionDetailsToRow(result.data));
    },
    [],
  );

  const handleUpdateTransaction = useCallback(
    async (input: Parameters<typeof updateTransaction>[0]) => {
      const result = await updateTransaction(input);

      if (!result.ok || !category) {
        return result;
      }

      setEditingTransaction(null);
      loadRows(category);
      router.refresh();

      return result;
    },
    [category, loadRows, router],
  );

  const includeBalance = rows.some((row) => row.balance != null);

  const tableColumns = useMemo(
    () =>
      createColumns({
        includeBalance,
        onViewDetails: handleViewDetails,
        onEdit: handleEdit,
      }),
    [includeBalance, handleViewDetails, handleEdit],
  );

  const summaryFooter = useMemo(() => {
    if (rows.length === 0) {
      return undefined;
    }

    const total = rows.reduce((sum, row) => sum + Number(row.value), 0);

    return { label: 'Total', value: total.toFixed(2) };
  }, [rows]);

  const title = category ? getCategoryTitle(category) : 'Category';

  return (
    <>
      <Sheet open={open} onOpenChange={handleSheetOpenChange}>
        <SheetContent className="flex w-full flex-col gap-4 overflow-y-auto sm:max-w-2xl">
          <SheetHeader>
            <SheetTitle className="flex flex-wrap items-center gap-2">
              {category?.categoryId &&
              category.categoryName &&
              category.categoryColor ? (
                <CategoryPill
                  name={category.categoryName}
                  color={category.categoryColor}
                />
              ) : (
                title
              )}
            </SheetTitle>
            <SheetDescription>
              Transactions from {dateFrom} to {dateTo}
            </SheetDescription>
          </SheetHeader>

          {isPending ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : null}

          {error ? (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          ) : null}

          {editError ? (
            <p className="text-sm text-destructive" role="alert">
              {editError}
            </p>
          ) : null}

          {!isPending && !error ? (
            <ImportDataTable
              columns={tableColumns}
              data={rows}
              paginate={rows.length > 25}
              summaryFooter={summaryFooter}
            />
          ) : null}
        </SheetContent>
      </Sheet>

      <TransactionDetailSheet
        transactionId={detailsTransactionId}
        open={detailsTransactionId !== null}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) {
            setDetailsTransactionId(null);
          }
        }}
      />

      <TransactionFormSheet
        open={editingTransaction !== null}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) {
            setEditingTransaction(null);
          }
        }}
        transaction={editingTransaction}
        categories={categories}
        onSubmit={handleUpdateTransaction}
      />
    </>
  );
}
