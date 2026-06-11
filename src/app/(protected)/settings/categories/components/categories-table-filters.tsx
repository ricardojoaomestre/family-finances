'use client';

import { TableFiltersCollapsible } from '@/components/data-table/table-filters-collapsible';
import { Button } from '@/components/ui/button';
import { Field, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Combobox } from '@/components/ui/combobox';
import {
  ALL_CATEGORY_STATUS_FILTER_VALUE,
  ALL_CATEGORY_TYPE_FILTER_VALUE,
  CATEGORY_STATUS_ACTIVE,
  CATEGORY_STATUS_INACTIVE,
  type CategoryTableFilters,
} from '@/lib/categories/filter-categories';
import {
  categoryTypeLabels,
  categoryTypeValues,
} from '@/lib/categories/category-type';

type CategoriesTableFiltersProps = {
  filters: CategoryTableFilters;
  onFiltersChange: (filters: CategoryTableFilters) => void;
  onClear: () => void;
  hasActiveFilters: boolean;
};

export function CategoriesTableFilters({
  filters,
  onFiltersChange,
  onClear,
  hasActiveFilters,
}: CategoriesTableFiltersProps) {
  function updateFilters(partial: Partial<CategoryTableFilters>) {
    onFiltersChange({ ...filters, ...partial });
  }

  return (
    <TableFiltersCollapsible hasActiveFilters={hasActiveFilters}>
      <div className="flex flex-wrap items-end gap-3">
        <Field className="min-w-[220px] flex-1">
          <FieldLabel htmlFor="category-name-filter">Name</FieldLabel>
          <Input
            id="category-name-filter"
            placeholder="Search by name…"
            value={filters.name}
            onChange={(event) => updateFilters({ name: event.target.value })}
          />
        </Field>

        <Field className="w-full sm:w-auto">
          <FieldLabel htmlFor="category-type-filter">Type</FieldLabel>
          <Combobox
            id="category-type-filter"
            className="w-full sm:w-40"
            value={filters.type}
            onValueChange={(type) =>
              updateFilters({
                type: type as CategoryTableFilters['type'],
              })
            }
            placeholder="All types"
            searchPlaceholder="Search types…"
            options={[
              { value: ALL_CATEGORY_TYPE_FILTER_VALUE, label: 'All types' },
              ...categoryTypeValues.map((type) => ({
                value: type,
                label: categoryTypeLabels[type],
              })),
            ]}
          />
        </Field>

        <Field className="w-full sm:w-auto">
          <FieldLabel htmlFor="category-status-filter">Status</FieldLabel>
          <Combobox
            id="category-status-filter"
            className="w-full sm:w-36"
            value={filters.status}
            onValueChange={(status) =>
              updateFilters({
                status: status as CategoryTableFilters['status'],
              })
            }
            placeholder="All statuses"
            searchPlaceholder="Search statuses…"
            options={[
              { value: ALL_CATEGORY_STATUS_FILTER_VALUE, label: 'All statuses' },
              { value: CATEGORY_STATUS_ACTIVE, label: 'Active' },
              { value: CATEGORY_STATUS_INACTIVE, label: 'Inactive' },
            ]}
          />
        </Field>

        <Button
          type="button"
          variant="ghost"
          disabled={!hasActiveFilters}
          onClick={onClear}
        >
          Clear filters
        </Button>
      </div>
    </TableFiltersCollapsible>
  );
}
