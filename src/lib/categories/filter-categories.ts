import type { CategoryType } from '@/lib/categories/category-type';
import type { CategoryRow } from '@/lib/categories/get-categories';

export const ALL_CATEGORY_TYPE_FILTER_VALUE = 'all' as const;
export const ALL_CATEGORY_STATUS_FILTER_VALUE = 'all' as const;
export const CATEGORY_STATUS_ACTIVE = 'active' as const;
export const CATEGORY_STATUS_INACTIVE = 'inactive' as const;

export type CategoryStatusFilter =
  | typeof ALL_CATEGORY_STATUS_FILTER_VALUE
  | typeof CATEGORY_STATUS_ACTIVE
  | typeof CATEGORY_STATUS_INACTIVE;

export type CategoryTypeFilter =
  | typeof ALL_CATEGORY_TYPE_FILTER_VALUE
  | CategoryType;

export type CategoryTableFilters = {
  name: string;
  type: CategoryTypeFilter;
  status: CategoryStatusFilter;
};

export const DEFAULT_CATEGORY_TABLE_FILTERS: CategoryTableFilters = {
  name: '',
  type: ALL_CATEGORY_TYPE_FILTER_VALUE,
  status: ALL_CATEGORY_STATUS_FILTER_VALUE,
};

export function filterCategories(
  rows: CategoryRow[],
  filters: CategoryTableFilters,
): CategoryRow[] {
  const nameQuery = filters.name.trim().toLowerCase();

  return rows.filter((row) => {
    if (nameQuery && !row.name.toLowerCase().includes(nameQuery)) {
      return false;
    }

    if (
      filters.type !== ALL_CATEGORY_TYPE_FILTER_VALUE &&
      row.type !== filters.type
    ) {
      return false;
    }

    if (
      filters.status === CATEGORY_STATUS_ACTIVE &&
      !row.active
    ) {
      return false;
    }

    if (
      filters.status === CATEGORY_STATUS_INACTIVE &&
      row.active
    ) {
      return false;
    }

    return true;
  });
}

export function hasActiveCategoryTableFilters(
  filters: CategoryTableFilters,
): boolean {
  return (
    filters.name.trim() !== '' ||
    filters.type !== ALL_CATEGORY_TYPE_FILTER_VALUE ||
    filters.status !== ALL_CATEGORY_STATUS_FILTER_VALUE
  );
}
