'use client';

import { Button } from '@/components/ui/button';
import { Field, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
        <Select
          value={filters.type}
          onValueChange={(type) =>
            updateFilters({
              type: type as CategoryTableFilters['type'],
            })
          }
        >
          <SelectTrigger id="category-type-filter" className="w-full sm:w-40">
            <SelectValue placeholder="All types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL_CATEGORY_TYPE_FILTER_VALUE}>
              All types
            </SelectItem>
            {categoryTypeValues.map((type) => (
              <SelectItem key={type} value={type}>
                {categoryTypeLabels[type]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>

      <Field className="w-full sm:w-auto">
        <FieldLabel htmlFor="category-status-filter">Status</FieldLabel>
        <Select
          value={filters.status}
          onValueChange={(status) =>
            updateFilters({
              status: status as CategoryTableFilters['status'],
            })
          }
        >
          <SelectTrigger id="category-status-filter" className="w-full sm:w-36">
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL_CATEGORY_STATUS_FILTER_VALUE}>
              All statuses
            </SelectItem>
            <SelectItem value={CATEGORY_STATUS_ACTIVE}>Active</SelectItem>
            <SelectItem value={CATEGORY_STATUS_INACTIVE}>Inactive</SelectItem>
          </SelectContent>
        </Select>
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
  );
}
