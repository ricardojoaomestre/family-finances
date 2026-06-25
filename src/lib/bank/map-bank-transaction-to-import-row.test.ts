import { describe, expect, it } from 'vitest';

import { mapBankTransactionToImportRow } from '@/lib/bank/map-bank-transaction-to-import-row';
import type { BankTransaction } from '@/lib/bank/types';

describe('mapBankTransactionToImportRow', () => {
  it('maps normalized bank transactions into import rows', () => {
    const transaction: BankTransaction = {
      id: 'tx-1',
      bookingDate: '2025-03-15',
      valueDate: '2025-03-14',
      amount: -42.5,
      currency: 'EUR',
      description: 'Supermarket',
      pending: false,
      balance: 1000,
    };

    expect(mapBankTransactionToImportRow(transaction)).toEqual({
      date: '2025-03-15',
      description: 'Supermarket',
      value: -42.5,
      balance: 1000,
      categoryId: null,
    });
  });
});
