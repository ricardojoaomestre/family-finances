import { count, desc, eq } from 'drizzle-orm';

import type { TransactionRow } from '@/lib/transactions/transaction-row';
import { db } from '@/db';
import { categories, transactions } from '@/db/schema';

import { buildTransactionWhere } from './build-transaction-where';
import type { TransactionListSearchParams } from './transaction-search-params';

export type PaginatedTransactionsResult = {
  rows: TransactionRow[];
  totalCount: number;
  page: number;
  pageSize: number;
  pageCount: number;
};

export async function getPaginatedTransactions(
  params: TransactionListSearchParams,
): Promise<PaginatedTransactionsResult> {
  const where = buildTransactionWhere(params.filters);
  const [{ total }] = await db
    .select({ total: count() })
    .from(transactions)
    .where(where);

  const totalCount = Number(total);
  const pageCount = Math.max(1, Math.ceil(totalCount / params.pageSize) || 1);
  const page =
    totalCount === 0
      ? 1
      : Math.min(Math.max(params.page, 1), pageCount);
  const offset = (page - 1) * params.pageSize;

  const rows = await db
    .select({
      id: transactions.id,
      date: transactions.date,
      description: transactions.description,
      categoryId: transactions.categoryId,
      categoryName: categories.name,
      categoryColor: categories.color,
      categoryIcon: categories.icon,
      value: transactions.value,
      importId: transactions.importId,
      merchant: transactions.merchant,
    })
    .from(transactions)
    .leftJoin(categories, eq(transactions.categoryId, categories.id))
    .where(where)
    .orderBy(desc(transactions.date))
    .limit(params.pageSize)
    .offset(offset);

  return {
    rows,
    totalCount,
    page,
    pageSize: params.pageSize,
    pageCount,
  };
}

export async function getTransactionCount(): Promise<number> {
  const [{ total }] = await db.select({ total: count() }).from(transactions);
  return Number(total);
}
