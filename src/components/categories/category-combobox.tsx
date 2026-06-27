'use client';

import { useMemo } from 'react';

import { CategoryIcon } from '@/components/categories/category-icon';
import { Combobox } from '@/components/ui/combobox';
import {
  filterCategorySelectorItems,
  type CategorySelectorFilter,
  type CategorySelectorItem,
} from '@/lib/categories/filter-category-selector-items';
import type { CategoryOption } from '@/lib/categories/to-category-options';
import { cn } from '@/lib/utils';

export type { CategoryOption, CategorySelectorFilter, CategorySelectorItem };

type CategoryComboboxProps = {
  id?: string;
  value: string;
  onValueChange: (value: string) => void;
  categories: readonly CategorySelectorItem[];
  filter?: CategorySelectorFilter;
  includeAllOption?: boolean;
  allValue?: string;
  allLabel?: string;
  includeNoneOption?: boolean;
  noneValue?: string;
  noneLabel?: string;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  autoFocusSearch?: boolean;
  'aria-label'?: string;
  'aria-invalid'?: boolean;
};

function toComboboxOptions(categories: readonly CategoryOption[]) {
  return categories.map((category) => ({
    value: category.id,
    label: category.name,
    leading: <CategoryIcon icon={category.icon} color={category.color} />,
  }));
}

export function CategoryCombobox({
  id,
  value,
  onValueChange,
  categories,
  filter,
  includeAllOption = false,
  allValue = '',
  allLabel = 'All categories',
  includeNoneOption = true,
  noneValue = '',
  noneLabel = 'None',
  placeholder = 'Select category',
  disabled = false,
  className,
  open,
  defaultOpen,
  onOpenChange,
  autoFocusSearch,
  'aria-label': ariaLabel,
  'aria-invalid': ariaInvalid,
}: CategoryComboboxProps) {
  const visibleCategories = useMemo(
    () => filterCategorySelectorItems(categories, filter),
    [categories, filter],
  );

  const options = [
    ...(includeAllOption ? [{ value: allValue, label: allLabel }] : []),
    ...(includeNoneOption ? [{ value: noneValue, label: noneLabel }] : []),
    ...toComboboxOptions(visibleCategories),
  ];

  return (
    <Combobox
      id={id}
      value={value}
      onValueChange={onValueChange}
      options={options}
      placeholder={placeholder}
      searchPlaceholder="Search category…"
      emptyMessage="No category found."
      disabled={disabled}
      className={cn('w-full', className)}
      open={open}
      defaultOpen={defaultOpen}
      onOpenChange={onOpenChange}
      autoFocusSearch={autoFocusSearch}
      aria-label={ariaLabel}
      aria-invalid={ariaInvalid}
    />
  );
}
