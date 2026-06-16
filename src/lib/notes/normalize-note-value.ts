import {
  isIncomeCategoryType,
  isSpendingCategoryType,
  type CategoryType,
} from '@/lib/categories/category-type';

export function isNoteEligibleCategoryType(
  type: CategoryType,
): type is 'spending' | 'income' {
  return isSpendingCategoryType(type) || isIncomeCategoryType(type);
}

export function normalizeNoteValueFromPositiveAmount(
  positiveAmount: number,
  categoryType: 'spending' | 'income',
): number {
  const absoluteAmount = Math.abs(positiveAmount);

  if (absoluteAmount === 0) {
    return 0;
  }

  return categoryType === 'income' ? absoluteAmount : -absoluteAmount;
}

export function formatPositiveAmountForNoteForm(value: string | number): string {
  const parsed = typeof value === 'number' ? value : Number(value);

  if (!Number.isFinite(parsed)) {
    return '';
  }

  return Math.abs(parsed).toFixed(2);
}
