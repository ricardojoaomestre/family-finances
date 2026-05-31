'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useTransition,
  type Dispatch,
  type SetStateAction,
} from 'react';
import type { ColumnDef, PaginationState } from '@tanstack/react-table';

import { ImportDataTable } from '@/app/(protected)/dashboard/components/import-data-table';
import { TransactionsTableFilters } from '@/app/(protected)/transactions/components/transactions-table-filters';
import {
  DEFAULT_TRANSACTION_FILTERS,
  hasActiveTransactionFilters,
  type TransactionFilters,
} from '@/app/(protected)/transactions/lib/filter-transactions';
import { CategoryPill } from '@/components/categories/category-pill';
import {
  TABLE_MONEY_CELL_CLASS,
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

const columns: ColumnDef<TransactionRow>[] = [
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
    cell: ({ row }) => {
      const { categoryName, categoryColor } = row.original;

      if (!categoryName || !categoryColor) {
        return '—';
      }

      return <CategoryPill name={categoryName} color={categoryColor} />;
    },
  },
  {
    accessorKey: 'value',
    header: () => <div className={TABLE_MONEY_CELL_CLASS}>Value</div>,
    cell: ({ row }) => <TableMoneyCell value={row.getValue('value')} />,
  },
  {
    accessorKey: 'merchant',
    header: 'Merchant',
    cell: ({ row }) => getMerchantLabelOrSlug(row.original.merchant),
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
        <DropdownMenuItem asChild>
          <Link href={`/imports/${row.original.importId}`}>View import</Link>
        </DropdownMenuItem>
      </DataTableRowActions>
    ),
  },
];

type CategoryFilterOption = {
  id: string;
  name: string;
};

type TransactionsTableProps = {
  listParams: TransactionListSearchParams;
  result: PaginatedTransactionsResult;
  categories: CategoryFilterOption[];
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

  return (
    <div className="flex flex-col gap-4">
      <TransactionsTableFilters
        filters={filters}
        categories={categories}
        onFiltersChange={handleFiltersChange}
        onClear={handleClearFilters}
        showClear={hasActiveTransactionFilters(filters)}
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
      />
    </div>
  );
}
