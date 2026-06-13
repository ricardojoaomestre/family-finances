import {
  DEFAULT_CATEGORY_TYPE,
  type CategoryType,
} from '@/lib/categories/category-type';
import { categoryNameKey } from '@/lib/categories/import/category-name-key';

export function inferSeedCategoryType(name: string): CategoryType {
  const key = categoryNameKey(name);

  if (key.includes('salário') || key.includes('salario')) {
    return 'income';
  }

  if (
    key.includes('poupança') ||
    key.includes('poupanca') ||
    key.includes('ppr')
  ) {
    return 'saving';
  }

  return DEFAULT_CATEGORY_TYPE;
}
