'use server';

import { getCategories } from '@/lib/categories/get-categories';
import { toCategorySelectorItems } from '@/lib/categories/to-category-selector-items';
import type { CategorySelectorItem } from '@/lib/categories/filter-category-selector-items';

export async function getCategorySelectorItems(): Promise<
  CategorySelectorItem[]
> {
  const rows = await getCategories();

  return toCategorySelectorItems(rows);
}
