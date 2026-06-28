import {
  isSavingCategoryType,
  isTransferCategoryType,
  type CategoryType,
} from '@/lib/categories/category-type';

export function categoryTypesForTransactionValue(
  value: string | number,
): Array<'spending' | 'income'> {
  const num = typeof value === 'string' ? Number(value) : value;

  if (!Number.isFinite(num) || num === 0) {
    return ['spending', 'income'];
  }

  return num > 0 ? ['income'] : ['spending'];
}

export function isCategoryTypeAllowedForTransactionValue(
  value: string | number,
  categoryType: CategoryType,
): boolean {
  if (
    isTransferCategoryType(categoryType) ||
    isSavingCategoryType(categoryType)
  ) {
    return true;
  }

  return categoryTypesForTransactionValue(value).includes(
    categoryType as 'spending' | 'income',
  );
}
