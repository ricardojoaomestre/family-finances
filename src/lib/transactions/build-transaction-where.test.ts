import { eq } from 'drizzle-orm';
import { describe, expect, it } from 'vitest';

import { DEFAULT_TRANSACTION_FILTERS } from '@/app/(protected)/transactions/lib/filter-transactions';
import { transactions } from '@/db/schema';
import { createTransactionWhereConditions } from '@/lib/transactions/build-transaction-where';

describe('createTransactionWhereConditions', () => {
  it('scopes queries to the active household', () => {
    const conditions = createTransactionWhereConditions(
      DEFAULT_TRANSACTION_FILTERS,
      'household-abc',
    );

    expect(conditions[0]).toEqual(eq(transactions.householdId, 'household-abc'));
  });

  it('keeps household scope when other filters are applied', () => {
    const conditions = createTransactionWhereConditions(
      {
        ...DEFAULT_TRANSACTION_FILTERS,
        description: 'coffee',
        dateFrom: '2025-01-01',
        dateTo: '2025-01-31',
        bankAccountId: 'account-1',
        categoryId: 'cat-1',
      },
      'household-xyz',
    );

    expect(conditions[0]).toEqual(eq(transactions.householdId, 'household-xyz'));
    expect(conditions.length).toBeGreaterThan(1);
  });
});
