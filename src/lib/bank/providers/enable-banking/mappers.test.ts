import { describe, expect, it } from 'vitest';

import {
  decodeBankInstitutionId,
  encodeBankInstitutionId,
} from '@/lib/bank/institution-id';
import {
  enrichTransactionsWithRunningBalances,
  mapEnableBankingTransaction,
  pickEnableBankingBookedBalance,
} from '@/lib/bank/providers/enable-banking/mappers';

describe('institution id codec', () => {
  it('encodes and decodes institution ids', () => {
    const id = encodeBankInstitutionId('pt', 'Banco BPI');
    expect(id).toBe('PT|Banco BPI');
    expect(decodeBankInstitutionId(id)).toEqual({
      countryCode: 'PT',
      name: 'Banco BPI',
    });
  });
});

describe('mapEnableBankingTransaction', () => {
  it('maps debit transactions to negative amounts', () => {
    expect(
      mapEnableBankingTransaction({
        entry_reference: 'tx-1',
        booking_date: '2025-03-15',
        transaction_amount: { currency: 'EUR', amount: '42.50' },
        credit_debit_indicator: 'DBIT',
        status: 'BOOK',
        remittance_information: ['Supermarket'],
        balance_after_transaction: { currency: 'EUR', amount: '1000.00' },
      }),
    ).toEqual({
      id: 'tx-1',
      bookingDate: '2025-03-15',
      valueDate: undefined,
      amount: -42.5,
      currency: 'EUR',
      description: 'Supermarket',
      pending: false,
      balance: 1000,
    });
  });
});

describe('running balance enrichment', () => {
  it('fills missing balances from the current booked balance', () => {
    const enriched = enrichTransactionsWithRunningBalances(
      [
        {
          id: 'older',
          bookingDate: '2025-03-14',
          amount: -50,
          currency: 'EUR',
          description: 'Coffee',
          pending: false,
          balance: null,
        },
        {
          id: 'newer',
          bookingDate: '2025-03-15',
          amount: -42.5,
          currency: 'EUR',
          description: 'Supermarket',
          pending: false,
          balance: null,
        },
      ],
      1000,
    );

    expect(enriched).toEqual([
      expect.objectContaining({ id: 'older', balance: 1042.5 }),
      expect.objectContaining({ id: 'newer', balance: 1000 }),
    ]);
  });

  it('prefers closing booked balances when available', () => {
    expect(
      pickEnableBankingBookedBalance([
        {
          balance_type: 'ITAV',
          balance_amount: { amount: '900.00', currency: 'EUR' },
        },
        {
          balance_type: 'CLBD',
          balance_amount: { amount: '1000.00', currency: 'EUR' },
        },
      ]),
    ).toBe(1000);
  });
});
