'use client';

import { useEffect, useMemo, useRef } from 'react';
import { Plus } from 'lucide-react';

import { CategoryIcon } from '@/components/categories/category-icon';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Field, FieldError, FieldLabel } from '@/components/ui/field';
import {
  filterCategorySelectorItems,
  type CategorySelectorFilter,
  type CategorySelectorItem,
} from '@/lib/categories/filter-category-selector-items';

type CategorizeCategoryPickerProps = {
  value: string;
  onValueChange: (value: string) => void;
  onConfirm: (categoryId: string) => void;
  categories: readonly CategorySelectorItem[];
  filter?: CategorySelectorFilter;
  disabled?: boolean;
  error?: string | null;
  onCreateCategory: () => void;
  focusSearch?: boolean;
  searchFocusKey?: string;
};

function findCategoryByCommandValue(
  categories: readonly CategorySelectorItem[],
  commandValue: string | null | undefined,
): CategorySelectorItem | undefined {
  const normalized = commandValue?.trim().toLowerCase();

  if (!normalized) {
    return undefined;
  }

  return categories.find(
    (category) => category.name.trim().toLowerCase() === normalized,
  );
}

function filterCategoriesBySearch(
  categories: readonly CategorySelectorItem[],
  searchQuery: string,
): CategorySelectorItem[] {
  const query = searchQuery.trim().toLowerCase();

  if (!query) {
    return [...categories];
  }

  return categories.filter((category) =>
    category.name.toLowerCase().includes(query),
  );
}

function resolveCategoryIdOnEnter(
  commandRoot: HTMLElement | null,
  categories: readonly CategorySelectorItem[],
  searchQuery: string,
  currentValue: string,
): string | null {
  if (commandRoot) {
    const highlightedItem = commandRoot.querySelector<HTMLElement>(
      '[cmdk-item][data-selected="true"]',
    );
    const highlightedCategory = findCategoryByCommandValue(
      categories,
      highlightedItem?.getAttribute('data-value') ??
        highlightedItem?.textContent,
    );

    if (highlightedCategory) {
      return highlightedCategory.id;
    }

    if (searchQuery.trim()) {
      const firstItem = commandRoot.querySelector<HTMLElement>('[cmdk-item]');
      const firstCategory = findCategoryByCommandValue(
        categories,
        firstItem?.getAttribute('data-value') ?? firstItem?.textContent,
      );

      if (firstCategory) {
        return firstCategory.id;
      }
    }
  }

  const filtered = filterCategoriesBySearch(categories, searchQuery);

  if (filtered.length > 0) {
    return filtered[0]?.id ?? null;
  }

  if (currentValue) {
    return currentValue;
  }

  return null;
}

export function CategorizeCategoryPicker({
  value,
  onValueChange,
  onConfirm,
  categories,
  filter,
  disabled = false,
  error,
  onCreateCategory,
  focusSearch = false,
  searchFocusKey,
}: CategorizeCategoryPickerProps) {
  const commandRef = useRef<HTMLDivElement>(null);

  const visibleCategories = useMemo(
    () => filterCategorySelectorItems(categories, filter),
    [categories, filter],
  );

  useEffect(() => {
    if (!focusSearch || disabled || !searchFocusKey) {
      return;
    }

    const frame = requestAnimationFrame(() => {
      const input = commandRef.current?.querySelector<HTMLInputElement>(
        '[data-slot="command-input"]',
      );
      input?.focus();
    });

    return () => cancelAnimationFrame(frame);
  }, [disabled, focusSearch, searchFocusKey]);

  function handleSearchKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (
      event.key !== 'Enter' ||
      event.shiftKey ||
      event.metaKey ||
      event.ctrlKey ||
      disabled
    ) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();

    const categoryId = resolveCategoryIdOnEnter(
      commandRef.current,
      visibleCategories,
      event.currentTarget.value,
      value,
    );

    onConfirm(categoryId ?? '');
  }

  return (
    <Field data-invalid={Boolean(error)} className="flex min-h-0 flex-1 flex-col gap-3">
      <FieldLabel htmlFor="categorize-category-search">Category</FieldLabel>

      <div
        ref={commandRef}
        className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border bg-card"
      >
        <Command className="min-h-0 flex-1 bg-transparent">
          <div className="border-b p-2">
            <CommandInput
              id="categorize-category-search"
              placeholder="Search category…"
              disabled={disabled}
              autoFocus={focusSearch}
              aria-invalid={Boolean(error)}
              onKeyDown={handleSearchKeyDown}
            />
          </div>
          <CommandList className="max-h-44">
            <CommandEmpty>No category found.</CommandEmpty>
            <CommandGroup>
              {visibleCategories.map((category) => (
                <CommandItem
                  key={category.id}
                  value={category.name}
                  data-checked={value === category.id}
                  disabled={disabled}
                  onSelect={() => onValueChange(category.id)}
                >
                  <span className="flex min-w-0 items-center gap-2">
                    <CategoryIcon icon={category.icon} color={category.color} />
                    <span className="truncate">{category.name}</span>
                  </span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </div>

      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="self-start px-0"
        disabled={disabled}
        onClick={onCreateCategory}
      >
        <Plus className="size-4" />
        Create category
      </Button>

      <FieldError>{error}</FieldError>
    </Field>
  );
}
