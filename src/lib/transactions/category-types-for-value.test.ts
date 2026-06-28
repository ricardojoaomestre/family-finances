import { describe, expect, it } from 'vitest';

import {
  categoryTypesForTransactionValue,
  isCategoryTypeAllowedForTransactionValue,
} from '@/lib/transactions/category-types-for-value';

describe('categoryTypesForTransactionValue', () => {
  it('returns income for positive amounts and spending for negative amounts', () => {
    expect(categoryTypesForTransactionValue(500)).toEqual(['income']);
    expect(categoryTypesForTransactionValue(-1000)).toEqual(['spending']);
  });

  it('returns both types for zero or invalid amounts', () => {
    expect(categoryTypesForTransactionValue(0)).toEqual(['spending', 'income']);
    expect(categoryTypesForTransactionValue('not-a-number')).toEqual([
      'spending',
      'income',
    ]);
  });
});

describe('isCategoryTypeAllowedForTransactionValue', () => {
  it('allows spending and income based on transaction sign', () => {
    expect(isCategoryTypeAllowedForTransactionValue(-1000, 'spending')).toBe(
      true,
    );
    expect(isCategoryTypeAllowedForTransactionValue(-1000, 'income')).toBe(
      false,
    );
    expect(isCategoryTypeAllowedForTransactionValue(500, 'income')).toBe(true);
    expect(isCategoryTypeAllowedForTransactionValue(500, 'spending')).toBe(
      false,
    );
  });

  it('allows transfer and saving categories for any amount', () => {
    expect(isCategoryTypeAllowedForTransactionValue(-1000, 'transfer')).toBe(
      true,
    );
    expect(isCategoryTypeAllowedForTransactionValue(500, 'transfer')).toBe(true);
    expect(isCategoryTypeAllowedForTransactionValue(-1000, 'saving')).toBe(
      true,
    );
    expect(isCategoryTypeAllowedForTransactionValue(500, 'saving')).toBe(true);
  });
});
