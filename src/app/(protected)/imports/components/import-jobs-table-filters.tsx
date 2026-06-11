'use client';

import {
  type ImportJobFilters,
  hasActiveImportJobFilters,
} from '@/app/(protected)/imports/lib/filter-import-jobs';
import { TableFiltersCollapsible } from '@/components/data-table/table-filters-collapsible';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { FieldLabel } from '@/components/ui/field';
import { MonthPicker } from '@/components/ui/month-picker';

type ImportJobsTableFiltersProps = {
  filters: ImportJobFilters;
  onFiltersChange: (filters: ImportJobFilters) => void;
};

export function ImportJobsTableFilters({
  filters,
  onFiltersChange,
}: ImportJobsTableFiltersProps) {
  function updateFilters(partial: Partial<ImportJobFilters>) {
    onFiltersChange({ ...filters, ...partial });
  }

  const hasActiveFilters = hasActiveImportJobFilters(filters);

  return (
    <TableFiltersCollapsible hasActiveFilters={hasActiveFilters}>
      <div className="flex flex-wrap items-end gap-3">
        <div className="flex w-full flex-col gap-2 sm:w-auto">
          <FieldLabel htmlFor="import-jobs-month-filter">Month</FieldLabel>
          <MonthPicker
            id="import-jobs-month-filter"
            disableFuture
            value={{ dateFrom: filters.dateFrom, dateTo: filters.dateTo }}
            onValueChange={({ dateFrom, dateTo }) =>
              updateFilters({ dateFrom, dateTo })
            }
          />
        </div>

        <div className="flex min-h-11 items-center gap-2 md:min-h-9">
          <Checkbox
            id="import-jobs-hide-empty"
            checked={filters.hideEmptyImports}
            onCheckedChange={(checked) =>
              updateFilters({ hideEmptyImports: checked === true })
            }
          />
          <FieldLabel htmlFor="import-jobs-hide-empty">
            Hide imports with no rows
          </FieldLabel>
        </div>

        <Button
          type="button"
          variant="ghost"
          disabled={!hasActiveFilters}
          onClick={() => updateFilters({ dateFrom: '', dateTo: '' })}
        >
          Clear filters
        </Button>
      </div>
    </TableFiltersCollapsible>
  );
}
