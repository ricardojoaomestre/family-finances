import type { CategorySelectorItem } from '@/lib/categories/filter-category-selector-items';
import type { CategoryRow } from '@/lib/categories/get-categories';

export function toCategorySelectorItems(
  rows: readonly CategoryRow[],
): CategorySelectorItem[] {
  return rows
    .filter((row) => row.active)
    .map(({ id, name, color, icon, type, active }) => ({
      id,
      name,
      color,
      icon,
      type,
      active,
    }));
}
