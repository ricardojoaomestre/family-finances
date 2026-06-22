import { describe, expect, it } from 'vitest';

import {
  filterCategorySelectorItems,
  type CategorySelectorItem,
} from '@/lib/categories/filter-category-selector-items';

const categories = [
  {
    id: 'active-spending',
    name: 'Groceries',
    color: 'emerald-200',
    icon: 'shopping-cart',
    active: true,
    type: 'spending',
  },
  {
    id: 'inactive-spending',
    name: 'Old category',
    color: 'rose-200',
    icon: 'tag',
    active: false,
    type: 'spending',
  },
  {
    id: 'active-income',
    name: 'Salary',
    color: 'sky-200',
    icon: 'wallet',
    active: true,
    type: 'income',
  },
] satisfies CategorySelectorItem[];

describe('filterCategorySelectorItems', () => {
  it('returns all categories when no filter is provided', () => {
    expect(filterCategorySelectorItems(categories)).toEqual([
      {
        id: 'active-spending',
        name: 'Groceries',
        color: 'emerald-200',
        icon: 'shopping-cart',
      },
      {
        id: 'inactive-spending',
        name: 'Old category',
        color: 'rose-200',
        icon: 'tag',
      },
      {
        id: 'active-income',
        name: 'Salary',
        color: 'sky-200',
        icon: 'wallet',
      },
    ]);
  });

  it('filters by active status, type, and excluded ids', () => {
    expect(
      filterCategorySelectorItems(categories, {
        activeOnly: true,
        types: ['spending'],
        excludeIds: ['active-spending'],
        includeIds: ['inactive-spending'],
      }),
    ).toEqual([
      {
        id: 'inactive-spending',
        name: 'Old category',
        color: 'rose-200',
        icon: 'tag',
      },
    ]);
  });
});
