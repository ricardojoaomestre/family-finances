import Link from 'next/link';
import { redirect } from 'next/navigation';

import { SetPageHeader } from '@/app/(protected)/components/protected-page-context';
import { TransactionsTable } from '@/app/(protected)/transactions/components/transactions-table';
import { hasActiveTransactionFilters } from '@/app/(protected)/transactions/lib/filter-transactions';
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from '@/components/ui/empty';
import { getCategories } from '@/lib/categories/get-categories';
import { toCategoryOptions } from '@/lib/categories/to-category-options';
import {
  getPaginatedTransactions,
  getTransactionCount,
} from '@/lib/transactions/get-paginated-transactions';
import {
  buildTransactionSearchParams,
  parseTransactionListSearchParams,
} from '@/lib/transactions/transaction-search-params';

type TransactionsPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function TransactionsPage({
  searchParams,
}: TransactionsPageProps) {
  const resolvedSearchParams = await searchParams;
  const listParams = parseTransactionListSearchParams(resolvedSearchParams);

  const [categoryRows, result] = await Promise.all([
    getCategories(),
    getPaginatedTransactions(listParams),
  ]);

  // When no filters are active the paginated count already covers every row,
  // so we only need a separate unfiltered count to tell "empty database" apart
  // from "filters matched nothing" when filters are in play.
  const totalInDb = hasActiveTransactionFilters(listParams.filters)
    ? await getTransactionCount()
    : result.totalCount;

  if (result.page !== listParams.page) {
    redirect(
      `/transactions${buildTransactionSearchParams({
        ...listParams,
        page: result.page,
      })}`,
    );
  }

  const categoryOptions = toCategoryOptions(categoryRows);

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 sm:p-6">
      <SetPageHeader description="All transactions from every import" />
      {totalInDb === 0 ? (
        <Empty>
          <EmptyHeader>
            <EmptyTitle>No transactions yet</EmptyTitle>
            <EmptyDescription>
              <span className="hidden md:contents">
                <Link href="/imports/new">Import a file</Link> to get started.
              </span>
              <span className="md:hidden">
                Use a desktop browser to import your first transactions.
              </span>
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <TransactionsTable
          listParams={listParams}
          result={result}
          categories={categoryOptions}
        />
      )}
    </div>
  );
}
