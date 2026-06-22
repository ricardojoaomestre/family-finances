import type { CategoryType } from '@/lib/categories/category-type';
import type { CategoryOption } from '@/lib/categories/to-category-options';

export type CategorySelectorItem = CategoryOption & {
  active?: boolean;
  type?: CategoryType;
};

export type CategorySelectorFilter = {
  activeOnly?: boolean;
  types?: CategoryType[];
  excludeIds?: string[];
  includeIds?: string[];
};

export function filterCategorySelectorItems(
  categories: readonly CategorySelectorItem[],
  filter?: CategorySelectorFilter,
): CategoryOption[] {
  if (!filter) {
    return categories.map(({ id, name, color, icon }) => ({
      id,
      name,
      color,
      icon,
    }));
  }

  const includeSet = new Set(filter.includeIds ?? []);
  const excludeSet = new Set(filter.excludeIds ?? []);

  return categories
    .filter((category) => {
      if (excludeSet.has(category.id) && !includeSet.has(category.id)) {
        return false;
      }

      if (
        filter.activeOnly &&
        category.active === false &&
        !includeSet.has(category.id)
      ) {
        return false;
      }

      if (
        filter.types?.length &&
        category.type &&
        !filter.types.includes(category.type) &&
        !includeSet.has(category.id)
      ) {
        return false;
      }

      return true;
    })
    .map(({ id, name, color, icon }) => ({ id, name, color, icon }));
}
