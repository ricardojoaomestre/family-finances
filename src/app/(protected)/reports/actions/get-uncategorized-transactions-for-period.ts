'use server';

import { getUncategorizedTransactionsForPeriod } from '@/lib/reports/get-uncategorized-transactions-for-period';
import type { CategorizeTransactionRow } from '@/lib/transactions/categorize-transaction-row';
import { validateReportDateRange } from '@/lib/reports/validate-report-date-range';

type GetUncategorizedTransactionsForPeriodResult =
  | { ok: true; transactions: CategorizeTransactionRow[] }
  | { ok: false; error: string };

export async function getUncategorizedTransactionsForReportPeriod(input: {
  dateFrom: string;
  dateTo: string;
}): Promise<GetUncategorizedTransactionsForPeriodResult> {
  const validation = validateReportDateRange(input.dateFrom, input.dateTo);

  if (!validation.ok) {
    return { ok: false, error: validation.message };
  }

  const transactions = await getUncategorizedTransactionsForPeriod(
    validation.dateFrom,
    validation.dateTo,
  );

  return { ok: true, transactions };
}
