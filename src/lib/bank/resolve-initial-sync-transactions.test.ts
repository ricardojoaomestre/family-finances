import { describe, expect, it } from 'vitest';

import type { BankTransaction } from '@/lib/bank/types';
import { resolveInitialSyncTransactions } from '@/lib/bank/resolve-initial-sync-transactions';

function makeTransaction(
  overrides: Partial<BankTransaction> & Pick<BankTransaction, 'id' | 'bookingDate'>,
): BankTransaction {
  return {
    valueDate: overrides.bookingDate,
    amount: -10,
    currency: 'EUR',
    description: 'Test',
    pending: false,
    ...overrides,
  };
}

describe('resolveInitialSyncTransactions', () => {
  it('keeps transactions inside the requested window', () => {
    const transactions = [
      makeTransaction({ id: 'in-range', bookingDate: '2026-04-10' }),
      makeTransaction({ id: 'out-of-range', bookingDate: '2021-04-10' }),
    ];

    const result = resolveInitialSyncTransactions(
      transactions,
      '2026-04-01',
      '2026-04-30',
    );

    expect(result.map((transaction) => transaction.id)).toEqual(['in-range']);
  });

  it('falls back to the latest available history when the window is empty', () => {
    const transactions = [
      makeTransaction({ id: 'old', bookingDate: '2021-06-01' }),
      makeTransaction({ id: 'latest', bookingDate: '2021-09-14' }),
      makeTransaction({ id: 'middle', bookingDate: '2021-08-01' }),
    ];

    const result = resolveInitialSyncTransactions(
      transactions,
      '2026-03-26',
      '2026-06-24',
    );

    expect(result.map((transaction) => transaction.id).sort()).toEqual([
      'latest',
      'middle',
    ]);
  });
});
