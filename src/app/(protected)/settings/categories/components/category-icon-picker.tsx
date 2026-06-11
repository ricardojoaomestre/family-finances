'use client';

import { CategoryIcon } from '@/components/categories/category-icon';
import {
  CATEGORY_ICON_NAMES,
  type CategoryIconName,
} from '@/lib/categories/category-icon-names';
import type { CategoryColorToken } from '@/lib/categories/category-colors';
import { cn } from '@/lib/utils';

type CategoryIconPickerProps = {
  value: CategoryIconName;
  color: CategoryColorToken;
  onChange: (icon: CategoryIconName) => void;
  disabled?: boolean;
};

export function CategoryIconPicker({
  value,
  color,
  onChange,
  disabled = false,
}: CategoryIconPickerProps) {
  return (
    <div
      className="grid grid-cols-6 gap-2 sm:grid-cols-10"
      role="radiogroup"
      aria-label="Category icon"
    >
      {CATEGORY_ICON_NAMES.map((iconName) => {
        const selected = iconName === value;

        return (
          <button
            key={iconName}
            type="button"
            role="radio"
            aria-checked={selected}
            aria-label={iconName}
            disabled={disabled}
            onClick={() => onChange(iconName)}
            className={cn(
              'cursor-pointer rounded-md transition-all',
              selected
                ? 'ring-2 ring-ring ring-offset-2 ring-offset-background'
                : 'hover:scale-105',
              disabled && 'pointer-events-none opacity-50',
            )}
          >
            <CategoryIcon icon={iconName} color={color} />
          </button>
        );
      })}
    </div>
  );
}
