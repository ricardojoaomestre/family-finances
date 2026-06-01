'use client';

import {
  ALL_FILTER_VALUE,
  type TransactionFilters,
  UNCATEGORIZED_FILTER_VALUE,
} from '@/app/(protected)/transactions/lib/filter-transactions';
import { Button } from '@/components/ui/button';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { Field, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { MERCHANTS_SORTED_BY_LABEL } from '@/lib/merchants';

type CategoryFilterOption = {
  id: string;
  name: string;
};

type TransactionsTableFiltersProps = {
  filters: TransactionFilters;
  categories: CategoryFilterOption[];
  onFiltersChange: (filters: TransactionFilters) => void;
  onClear: () => void;
  hasActiveFilters: boolean;
};

export function TransactionsTableFilters({
  filters,
  categories,
  onFiltersChange,
  onClear,
  hasActiveFilters,
}: TransactionsTableFiltersProps) {
  function updateFilters(partial: Partial<TransactionFilters>) {
    onFiltersChange({ ...filters, ...partial });
  }

  return (
    <div className="flex flex-wrap items-end gap-3">
      <Field className="min-w-[220px] flex-1">
        <FieldLabel htmlFor="transaction-description-filter">
          Description
        </FieldLabel>
        <Input
          id="transaction-description-filter"
          placeholder="Search description…"
          value={filters.description}
          onChange={(event) =>
            updateFilters({ description: event.target.value })
          }
        />
      </Field>

      <Field className="w-full sm:w-auto">
        <FieldLabel htmlFor="transaction-category-filter">Category</FieldLabel>
        <Select
          value={filters.categoryId}
          onValueChange={(categoryId) => updateFilters({ categoryId })}
        >
          <SelectTrigger id="transaction-category-filter" className="w-full sm:w-44">
            <SelectValue placeholder="All categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL_FILTER_VALUE}>All categories</SelectItem>
            <SelectItem value={UNCATEGORIZED_FILTER_VALUE}>
              Uncategorized
            </SelectItem>
            {categories.map((category) => (
              <SelectItem key={category.id} value={category.id}>
                {category.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>

      <Field className="w-full sm:w-auto">
        <FieldLabel htmlFor="transaction-merchant-filter">Merchant</FieldLabel>
        <Select
          value={filters.merchant}
          onValueChange={(merchant) => updateFilters({ merchant })}
        >
          <SelectTrigger id="transaction-merchant-filter" className="w-full sm:w-52">
            <SelectValue placeholder="All merchants" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL_FILTER_VALUE}>All merchants</SelectItem>
            {MERCHANTS_SORTED_BY_LABEL.map(({ slug, label }) => (
              <SelectItem key={slug} value={slug}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>

      <Field className="w-full sm:w-auto">
        <FieldLabel htmlFor="transaction-date-range-filter">Date range</FieldLabel>
        <DateRangePicker
          id="transaction-date-range-filter"
          value={{ dateFrom: filters.dateFrom, dateTo: filters.dateTo }}
          onValueChange={({ dateFrom, dateTo }) =>
            updateFilters({ dateFrom, dateTo })
          }
          clearable
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
  );
}
