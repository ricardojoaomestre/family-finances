'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
  type Dispatch,
  type SetStateAction,
} from 'react';
import type { ColumnDef, PaginationState } from '@tanstack/react-table';

import { SetPageHeader } from '@/app/(protected)/components/protected-page-context';
import { ImportDataTable } from '@/app/(protected)/dashboard/components/import-data-table';
import { updateTransaction } from '@/app/(protected)/transactions/actions/update-transaction';
import { TransactionDetailSheet } from '@/app/(protected)/transactions/components/transaction-detail-sheet';
import { TransactionFormSheet } from '@/app/(protected)/transactions/components/transaction-form-sheet';
import { TransactionsFilterExportButton } from '@/app/(protected)/transactions/components/transactions-filter-export-button';
import { TransactionsFilterValueStat } from '@/app/(protected)/transactions/components/transactions-filter-value-stat';
import { TransactionsTableFilters } from '@/app/(protected)/transactions/components/transactions-table-filters';
import {
  DEFAULT_TRANSACTION_FILTERS,
  hasActiveTransactionFilters,
  type TransactionFilters,
} from '@/app/(protected)/transactions/lib/filter-transactions';
import { CategoryPill } from '@/components/categories/category-pill';
import type { CategoryColorToken } from '@/lib/categories/category-colors';
import type { CategoryIconName } from '@/lib/categories/category-icons';
import {
  TABLE_MONEY_HEADER_CLASS,
  TableMoneyCell,
} from '@/components/data-table/table-money-cell';
import { DataTableRowActions } from '@/components/data-table/row-actions';
import { DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { formatDisplayDate } from '@/lib/formatters';
import { getMerchantLabelOrSlug } from '@/lib/merchants';
import type { PaginatedTransactionsResult } from '@/lib/transactions/get-paginated-transactions';
import type { TransactionRow } from '@/lib/transactions/transaction-row';
import {
  buildTransactionSearchParams,
  type TransactionListSearchParams,
} from '@/lib/transactions/transaction-search-params';

export type { TransactionRow };

const DESCRIPTION_FILTER_DEBOUNCE_MS = 300;

function createTransactionColumns({
  onViewDetails,
  onEdit,
}: {
  onViewDetails: (transaction: TransactionRow) => void;
  onEdit: (transaction: TransactionRow) => void;
}): ColumnDef<TransactionRow>[] {
  return [
    {
      accessorKey: 'date',
      header: 'Date',
      cell: ({ row }) => formatDisplayDate(row.original.date),
      meta: {
        cellClassName: 'align-top text-muted-foreground md:align-middle md:text-foreground',
      },
    },
    {
      accessorKey: 'description',
      header: 'Description',
      cell: ({ row }) => {
        const { categoryName, categoryColor, categoryIcon } = row.original;

        return (
          <div className="flex flex-col gap-1.5">
            <span className="whitespace-normal">
              {row.getValue('description')}
            </span>
            {categoryName && categoryColor ? (
              <span className="md:hidden">
                <CategoryPill
                  name={categoryName}
                  color={categoryColor}
                  icon={categoryIcon ?? 'tag'}
                />
              </span>
            ) : null}
          </div>
        );
      },
      meta: {
        cellClassName: 'align-top md:align-middle',
      },
    },
    {
      accessorKey: 'categoryName',
      header: 'Category',
      cell: ({ row }) => {
        const { categoryName, categoryColor, categoryIcon } = row.original;

        if (!categoryName || !categoryColor) {
          return '—';
        }

        return (
          <CategoryPill
            name={categoryName}
            color={categoryColor}
            icon={categoryIcon ?? 'tag'}
          />
        );
      },
      meta: {
        headerClassName: 'hidden md:table-cell',
        cellClassName: 'hidden md:table-cell',
      },
    },
    {
      accessorKey: 'value',
      header: () => <div className={TABLE_MONEY_HEADER_CLASS}>Value</div>,
      cell: ({ row }) => <TableMoneyCell value={row.getValue('value')} />,
      meta: {
        cellClassName: 'align-top md:align-middle',
      },
    },
    {
      accessorKey: 'merchant',
      header: 'Merchant',
      cell: ({ row }) => getMerchantLabelOrSlug(row.original.merchant),
      meta: {
        headerClassName: 'hidden lg:table-cell',
        cellClassName: 'hidden lg:table-cell',
      },
    },
    {
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
          <DropdownMenuItem asChild>
            <Link href={`/imports/${row.original.importId}`}>View import</Link>
          </DropdownMenuItem>
        </DataTableRowActions>
      ),
    },
  ];
}

type CategoryOption = {
  id: string;
  name: string;
  color: CategoryColorToken;
  icon: CategoryIconName;
};

type TransactionsTableProps = {
  listParams: TransactionListSearchParams;
  result: PaginatedTransactionsResult;
  categories: CategoryOption[];
};

function resolvePagination(
  updater: SetStateAction<PaginationState>,
  current: PaginationState,
): PaginationState {
  return typeof updater === 'function' ? updater(current) : updater;
}

export function TransactionsTable({
  listParams,
  result,
  categories,
}: TransactionsTableProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [editingTransaction, setEditingTransaction] =
    useState<TransactionRow | null>(null);
  const [detailsTransactionId, setDetailsTransactionId] = useState<
    string | null
  >(null);
  const [descriptionDraft, setDescriptionDraft] = useState<string | null>(null);
  const descriptionDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );

  const filters: TransactionFilters = {
    ...listParams.filters,
    description: descriptionDraft ?? listParams.filters.description,
  };

  useEffect(() => {
    return () => {
      if (descriptionDebounceRef.current) {
        clearTimeout(descriptionDebounceRef.current);
      }
    };
  }, []);

  const navigate = useCallback(
    (updates: {
      page?: number;
      pageSize?: number;
      filters?: TransactionFilters;
    }) => {
      const next: TransactionListSearchParams = {
        page: updates.page ?? listParams.page,
        pageSize: updates.pageSize ?? listParams.pageSize,
        filters: updates.filters ?? listParams.filters,
      };

      startTransition(() => {
        router.replace(`/transactions${buildTransactionSearchParams(next)}`);
      });
    },
    [listParams, router],
  );

  const handleFiltersChange = (partial: Partial<TransactionFilters>) => {
    const nextFilters = { ...filters, ...partial };

    if ('description' in partial) {
      setDescriptionDraft(partial.description ?? '');

      if (descriptionDebounceRef.current) {
        clearTimeout(descriptionDebounceRef.current);
      }

      descriptionDebounceRef.current = setTimeout(() => {
        setDescriptionDraft(null);
        navigate({ filters: nextFilters, page: 1 });
      }, DESCRIPTION_FILTER_DEBOUNCE_MS);
      return;
    }

    if (descriptionDebounceRef.current) {
      clearTimeout(descriptionDebounceRef.current);
    }

    setDescriptionDraft(null);
    navigate({ filters: nextFilters, page: 1 });
  };

  const handleClearFilters = () => {
    if (descriptionDebounceRef.current) {
      clearTimeout(descriptionDebounceRef.current);
    }

    setDescriptionDraft(null);
    navigate({ filters: DEFAULT_TRANSACTION_FILTERS, page: 1 });
  };

  const pagination: PaginationState = {
    pageIndex: result.page - 1,
    pageSize: result.pageSize,
  };

  const handlePaginationChange: Dispatch<SetStateAction<PaginationState>> = (
    updater,
  ) => {
    const next = resolvePagination(updater, pagination);
    navigate({
      page: next.pageIndex + 1,
      pageSize: next.pageSize,
    });
  };

  const handleViewTransactionDetails = useCallback((transaction: TransactionRow) => {
    setDetailsTransactionId(transaction.id);
  }, []);

  const handleEditTransaction = useCallback((transaction: TransactionRow) => {
    setEditingTransaction(transaction);
  }, []);

  const handleUpdateTransaction = useCallback(
    async (input: Parameters<typeof updateTransaction>[0]) => {
      const result = await updateTransaction(input);

      if (result.ok) {
        setEditingTransaction(null);
        router.refresh();
      }

      return result;
    },
    [router],
  );

  const columns = useMemo(
    () =>
      createTransactionColumns({
        onViewDetails: handleViewTransactionDetails,
        onEdit: handleEditTransaction,
      }),
    [handleViewTransactionDetails, handleEditTransaction],
  );

  const hasActiveFilters = hasActiveTransactionFilters(filters);

  return (
    <div className="flex flex-col gap-4">
      <SetPageHeader
        description="All transactions from every import"
        actions={
          hasActiveFilters ? (
            <div className="flex items-center gap-2">
              <TransactionsFilterExportButton filters={filters} />
              <TransactionsFilterValueStat filters={filters} />
            </div>
          ) : undefined
        }
      />
      <TransactionsTableFilters
        filters={filters}
        categories={categories}
        onFiltersChange={handleFiltersChange}
        onClear={handleClearFilters}
        hasActiveFilters={hasActiveFilters}
      />
      <ImportDataTable
        columns={columns}
        data={result.rows}
        isLoading={isPending}
        manualPagination
        rowCount={result.totalCount}
        pageCount={result.pageCount}
        pagination={pagination}
        onPaginationChange={handlePaginationChange}
        renderMobileCard={({ original: transaction }) => (
          <div className="flex items-start justify-between gap-3">
            <button
              type="button"
              className="min-w-0 flex-1 text-left"
              onClick={() => handleViewTransactionDetails(transaction)}
            >
              <p className="text-sm font-medium">{transaction.description}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {formatDisplayDate(transaction.date)} ·{' '}
                {getMerchantLabelOrSlug(transaction.merchant)}
              </p>
              {transaction.categoryName && transaction.categoryColor ? (
                <span className="mt-2 inline-flex">
                  <CategoryPill
                    name={transaction.categoryName}
                    color={transaction.categoryColor}
                    icon={transaction.categoryIcon ?? 'tag'}
                  />
                </span>
              ) : null}
            </button>
            <div className="flex shrink-0 flex-col items-end gap-1">
              <TableMoneyCell value={transaction.value} />
              <DataTableRowActions>
                <DropdownMenuItem
                  onSelect={() => handleViewTransactionDetails(transaction)}
                >
                  View details
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={() => handleEditTransaction(transaction)}>
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href={`/imports/${transaction.importId}`}>
                    View import
                  </Link>
                </DropdownMenuItem>
              </DataTableRowActions>
            </div>
          </div>
        )}
      />
      <TransactionFormSheet
        open={editingTransaction !== null}
        onOpenChange={(open) => {
          if (!open) {
            setEditingTransaction(null);
          }
        }}
        transaction={editingTransaction}
        categories={categories}
        onSubmit={handleUpdateTransaction}
      />
      <TransactionDetailSheet
        transactionId={detailsTransactionId}
        open={detailsTransactionId !== null}
        onOpenChange={(open) => {
          if (!open) {
            setDetailsTransactionId(null);
          }
        }}
      />
    </div>
  );
}
