'use server';

import { getCategories } from '@/lib/categories/get-categories';
import type { CategorySelectorItem } from '@/lib/categories/filter-category-selector-items';

export async function getCategorySelectorItems(): Promise<
  CategorySelectorItem[]
> {
  const rows = await getCategories();

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
