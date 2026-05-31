import {
  ALL_FILTER_VALUE,
  DEFAULT_TRANSACTION_FILTERS,
  type TransactionFilters,
} from '@/app/(protected)/transactions/lib/filter-transactions';
import {
  DATA_TABLE_DEFAULT_PAGE_SIZE,
  isDataTablePageSize,
} from '@/lib/data-table/pagination';

export type TransactionListSearchParams = {
  page: number;
  pageSize: number;
  filters: TransactionFilters;
};

function readParam(
  params: Record<string, string | string[] | undefined>,
  key: string,
): string {
  const value = params[key];
  if (Array.isArray(value)) {
    return value[0] ?? '';
  }
  return value ?? '';
}

function parsePositiveInt(value: string, fallback: number): number {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed < 1) {
    return fallback;
  }
  return parsed;
}

export function parseTransactionListSearchParams(
  params: Record<string, string | string[] | undefined>,
): TransactionListSearchParams {
  const rawPageSize = parsePositiveInt(
    readParam(params, 'pageSize'),
    DATA_TABLE_DEFAULT_PAGE_SIZE,
  );
  const pageSize = isDataTablePageSize(rawPageSize)
    ? rawPageSize
    : DATA_TABLE_DEFAULT_PAGE_SIZE;

  return {
    page: parsePositiveInt(readParam(params, 'page'), 1),
    pageSize,
    filters: {
      description: readParam(params, 'description'),
      categoryId: readParam(params, 'categoryId') || ALL_FILTER_VALUE,
      merchant: readParam(params, 'merchant') || ALL_FILTER_VALUE,
      dateFrom: readParam(params, 'dateFrom'),
      dateTo: readParam(params, 'dateTo'),
    },
  };
}

type BuildTransactionSearchParamsInput = {
  page?: number;
  pageSize?: number;
  filters?: Partial<TransactionFilters>;
};

export function buildTransactionSearchParams(
  current: TransactionListSearchParams,
  updates: BuildTransactionSearchParamsInput = {},
): string {
  const page = updates.page ?? current.page;
  const pageSize = updates.pageSize ?? current.pageSize;
  const filters = { ...current.filters, ...updates.filters };
  const searchParams = new URLSearchParams();

  if (page > 1) {
    searchParams.set('page', String(page));
  }

  if (pageSize !== DATA_TABLE_DEFAULT_PAGE_SIZE) {
    searchParams.set('pageSize', String(pageSize));
  }

  const description = filters.description.trim();
  if (description) {
    searchParams.set('description', description);
  }

  if (filters.categoryId !== ALL_FILTER_VALUE) {
    searchParams.set('categoryId', filters.categoryId);
  }

  if (filters.merchant !== ALL_FILTER_VALUE) {
    searchParams.set('merchant', filters.merchant);
  }

  if (filters.dateFrom) {
    searchParams.set('dateFrom', filters.dateFrom);
  }

  if (filters.dateTo) {
    searchParams.set('dateTo', filters.dateTo);
  }

  const query = searchParams.toString();
  return query ? `?${query}` : '';
}

export function getDefaultTransactionListSearchParams(): TransactionListSearchParams {
  return {
    page: 1,
    pageSize: DATA_TABLE_DEFAULT_PAGE_SIZE,
    filters: DEFAULT_TRANSACTION_FILTERS,
  };
}
