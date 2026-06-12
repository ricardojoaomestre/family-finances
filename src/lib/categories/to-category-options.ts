import type { CategoryColorToken } from '@/lib/categories/category-colors';
import type { CategoryIconName } from '@/lib/categories/category-icons';

export type CategoryOption = {
  id: string;
  name: string;
  color: CategoryColorToken;
  icon: CategoryIconName;
};

export function toCategoryOptions(
  rows: readonly CategoryOption[],
): CategoryOption[] {
  return rows.map(({ id, name, color, icon }) => ({ id, name, color, icon }));
}
