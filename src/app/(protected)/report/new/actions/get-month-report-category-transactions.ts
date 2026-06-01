'use server';

import { auth } from '@/auth';
import { getMonthReportCategoryTransactions } from '@/lib/reports/get-month-report-category-transactions';
import type { MonthReportCategoryTransactionRow } from '@/lib/reports/month-report-category-transaction-row';
import { validateReportDateRange } from '@/lib/reports/validate-report-date-range';

export type GetMonthReportCategoryTransactionsResult =
  | { ok: true; data: MonthReportCategoryTransactionRow[] }
  | { ok: false; error: string };

type GetMonthReportCategoryTransactionsInput = {
  dateFrom: string;
  dateTo: string;
  categoryId: string | null;
};

export async function getMonthReportCategoryTransactionsAction(
  input: GetMonthReportCategoryTransactionsInput,
): Promise<GetMonthReportCategoryTransactionsResult> {
  const session = await auth();

  if (!session?.user?.id) {
    return { ok: false, error: 'You must be signed in.' };
  }

  const validation = validateReportDateRange(input.dateFrom, input.dateTo);

  if (!validation.ok) {
    return { ok: false, error: validation.message };
  }

  const data = await getMonthReportCategoryTransactions(
    validation.dateFrom,
    validation.dateTo,
    input.categoryId,
  );

  return { ok: true, data };
}
