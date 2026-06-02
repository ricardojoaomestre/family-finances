export const categoryTypeValues = [
  'spending',
  'income',
  'transfer',
  'saving',
] as const;

export type CategoryType = (typeof categoryTypeValues)[number];

export const DEFAULT_CATEGORY_TYPE: CategoryType = 'spending';

const categoryTypeSet = new Set<string>(categoryTypeValues);

const categoryTypeAliases: Record<string, CategoryType> = {
  savings: 'saving',
};

export function isCategoryType(value: string): value is CategoryType {
  return categoryTypeSet.has(value);
}

export function resolveCategoryType(value: unknown): CategoryType {
  if (typeof value !== 'string') {
    return DEFAULT_CATEGORY_TYPE;
  }

  const normalized = value.trim().toLowerCase();

  if (isCategoryType(normalized)) {
    return normalized;
  }

  return categoryTypeAliases[normalized] ?? DEFAULT_CATEGORY_TYPE;
}

export function validateCategoryType(type: string): string | null {
  if (!isCategoryType(type)) {
    return 'Select a category type.';
  }

  return null;
}

export const categoryTypeLabels: Record<CategoryType, string> = {
  spending: 'Spending',
  income: 'Income',
  transfer: 'Transfer',
  saving: 'Saving',
};

export const categoryTypeDescriptions: Record<CategoryType, string> = {
  spending:
    'Everyday expenses. Included in spending breakdowns and dashboards.',
  income:
    'Money in (salary, refunds, etc.). Excluded from spending totals.',
  transfer:
    'Internal movements (account transfers, credit card payments). Excluded from spending totals.',
  saving:
    'Money set aside. Tracked separately from consumption.',
};

export function isTransferCategoryType(type: CategoryType): boolean {
  return type === 'transfer';
}

export function isSavingCategoryType(type: CategoryType): boolean {
  return type === 'saving';
}

export function isIncomeCategoryType(type: CategoryType): boolean {
  return type === 'income';
}

export function isSpendingCategoryType(type: CategoryType): boolean {
  return type === 'spending';
}

export const categoryTypesExcludedFromSpendingTotals: CategoryType[] = [
  'transfer',
  'income',
];
