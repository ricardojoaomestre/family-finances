'use client';

import {
  ALL_FILTER_VALUE,
  type TransactionFilters,
  UNCATEGORIZED_FILTER_VALUE,
} from '@/app/(protected)/transactions/lib/filter-transactions';
import { CategoryCombobox } from '@/components/categories/category-combobox';
import { TableFiltersCollapsible } from '@/components/data-table/table-filters-collapsible';
import { Button } from '@/components/ui/button';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { Field, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Combobox } from '@/components/ui/combobox';
import type { CategoryOption } from '@/lib/categories/to-category-options';

type BankAccountFilterOption = {
  id: string;
  label: string;
};

type TransactionsTableFiltersProps = {
  filters: TransactionFilters;
  categories: CategoryOption[];
  bankAccounts: BankAccountFilterOption[];
  onFiltersChange: (filters: TransactionFilters) => void;
  onClear: () => void;
  hasActiveFilters: boolean;
};

export function TransactionsTableFilters({
  filters,
  categories,
  bankAccounts,
  onFiltersChange,
  onClear,
  hasActiveFilters,
}: TransactionsTableFiltersProps) {
  function updateFilters(partial: Partial<TransactionFilters>) {
    onFiltersChange({ ...filters, ...partial });
  }

  return (
    <TableFiltersCollapsible hasActiveFilters={hasActiveFilters}>
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
          <FieldLabel htmlFor="transaction-category-filter">
            Category
          </FieldLabel>
          <CategoryCombobox
            id="transaction-category-filter"
            className="w-full sm:w-44"
            value={filters.categoryId}
            onValueChange={(categoryId) => updateFilters({ categoryId })}
            categories={categories}
            includeAllOption
            allValue={ALL_FILTER_VALUE}
            allLabel="All categories"
            includeNoneOption
            noneValue={UNCATEGORIZED_FILTER_VALUE}
            noneLabel="Uncategorized"
            placeholder="All categories"
          />
        </Field>

        <Field className="w-full sm:w-auto">
          <FieldLabel htmlFor="transaction-account-filter">Account</FieldLabel>
          <Combobox
            id="transaction-account-filter"
            className="w-full sm:w-52"
            value={filters.bankAccountId}
            onValueChange={(bankAccountId) => updateFilters({ bankAccountId })}
            placeholder="All accounts"
            searchPlaceholder="Search accounts…"
            options={[
              { value: ALL_FILTER_VALUE, label: 'All accounts' },
              ...bankAccounts.map((account) => ({
                value: account.id,
                label: account.label,
              })),
            ]}
          />
        </Field>

        <Field className="w-full sm:w-auto">
          <FieldLabel htmlFor="transaction-date-range-filter">
            Date range
          </FieldLabel>
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
    </TableFiltersCollapsible>
  );
}
