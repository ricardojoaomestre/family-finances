import { describe, expect, it } from 'vitest';

import {
  filterBankTransactionsByPeriod,
  getBankTransactionDateKey,
} from '@/lib/bank/filter-bank-transactions-by-period';
import type { BankTransaction } from '@/lib/bank/types';

function makeTransaction(
  overrides: Partial<BankTransaction> = {},
): BankTransaction {
  return {
    id: '1',
    bookingDate: '2026-04-15',
    amount: -10,
    currency: 'EUR',
    description: 'Test',
    pending: false,
    ...overrides,
  };
}

describe('getBankTransactionDateKey', () => {
  it('uses booking date before value date', () => {
    expect(
      getBankTransactionDateKey(
        makeTransaction({
          bookingDate: '2026-04-01',
          valueDate: '2026-04-02',
        }),
      ),
    ).toBe('2026-04-01');
  });

  it('falls back to value date when booking date is empty', () => {
    expect(
      getBankTransactionDateKey(
        makeTransaction({ bookingDate: '', valueDate: '2026-04-02' }),
      ),
    ).toBe('2026-04-02');
  });
});

describe('filterBankTransactionsByPeriod', () => {
  it('keeps only transactions within the inclusive period', () => {
    const transactions = [
      makeTransaction({ id: 'before', bookingDate: '2026-03-31' }),
      makeTransaction({ id: 'start', bookingDate: '2026-04-01' }),
      makeTransaction({ id: 'middle', bookingDate: '2026-04-15' }),
      makeTransaction({ id: 'end', bookingDate: '2026-04-30' }),
      makeTransaction({ id: 'after', bookingDate: '2026-05-01' }),
    ];

    expect(
      filterBankTransactionsByPeriod(transactions, '2026-04-01', '2026-04-30').map(
        (transaction) => transaction.id,
      ),
    ).toEqual(['start', 'middle', 'end']);
  });
});
