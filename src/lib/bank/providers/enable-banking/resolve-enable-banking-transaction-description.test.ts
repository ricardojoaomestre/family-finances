import { describe, expect, it } from 'vitest';

import {
  enableBankingTransactionNeedsDetails,
  resolveEnableBankingTransactionDescription,
} from '@/lib/bank/providers/enable-banking/resolve-enable-banking-transaction-description';

describe('resolveEnableBankingTransactionDescription', () => {
  it('joins remittance lines and ignores empty values', () => {
    expect(
      resolveEnableBankingTransactionDescription({
        remittance_information: ['', 'Continente', '  '],
      }),
    ).toBe('Continente');
  });

  it('uses card-related fallbacks when remittance is missing', () => {
    expect(
      resolveEnableBankingTransactionDescription({
        note: 'Uber Trip',
        creditor: { name: 'Ignored when note exists' },
      }),
    ).toBe('Uber Trip');
  });

  it('falls back to creditor and agent names', () => {
    expect(
      resolveEnableBankingTransactionDescription({
        creditor_agent: { name: 'WELL\'S' },
      }),
    ).toBe("WELL'S");
  });

  it('marks sparse list rows as needing detail lookup', () => {
    expect(
      enableBankingTransactionNeedsDetails({
        transaction_id: 'detail-id',
      }),
    ).toBe(true);
  });
});
