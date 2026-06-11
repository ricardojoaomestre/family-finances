'use client';

import { CategoryIcon } from '@/components/categories/category-icon';
import { Combobox } from '@/components/ui/combobox';
import type { CategoryIconName } from '@/lib/categories/category-icons';
import type { CategoryColorToken } from '@/lib/categories/category-colors';
import { cn } from '@/lib/utils';

type CategoryComboboxOption = {
  id: string;
  name: string;
  color: CategoryColorToken;
  icon: CategoryIconName;
};

type CategoryComboboxProps = {
  id?: string;
  value: string;
  onValueChange: (value: string) => void;
  categories: CategoryComboboxOption[];
  noneValue: string;
  noneLabel?: string;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  'aria-invalid'?: boolean;
};

export function CategoryCombobox({
  id,
  value,
  onValueChange,
  categories,
  noneValue,
  noneLabel = 'None',
  placeholder = 'None',
  disabled = false,
  className,
  'aria-invalid': ariaInvalid,
}: CategoryComboboxProps) {
  const options = [
    { value: noneValue, label: noneLabel },
    ...categories.map((category) => ({
      value: category.id,
      label: category.name,
      leading: (
        <CategoryIcon icon={category.icon} color={category.color} />
      ),
    })),
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
      aria-invalid={ariaInvalid}
    />
  );
}
