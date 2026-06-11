import { isCategoryColorToken } from '@/lib/categories/category-colors';
import { isCategoryIconName } from '@/lib/categories/category-icons';
import { validateCategoryType } from '@/lib/categories/category-type';

export function validateCategoryPattern(pattern: string): string | null {
  const trimmed = pattern.trim();

  if (!trimmed) {
    return null;
  }

  try {
    new RegExp(trimmed, 'i');
    return null;
  } catch {
    return 'Invalid regular expression.';
  }
}

const CATEGORY_NAME_MAX_LENGTH = 40;
const CATEGORY_DESCRIPTION_MAX_LENGTH = 500;

export function validateCategoryName(
  name: string,
  options?: { existingName?: string | null },
): string | null {
  const trimmed = name.trim();

  if (!trimmed) {
    return 'Name is required.';
  }

  if (trimmed.length > CATEGORY_NAME_MAX_LENGTH) {
    const existingTrimmed = options?.existingName?.trim();

    if (existingTrimmed && existingTrimmed === trimmed) {
      return null;
    }

    return `Name must be ${CATEGORY_NAME_MAX_LENGTH} characters or fewer.`;
  }

  return null;
}

export function validateCategoryDescription(description: string): string | null {
  if (description.trim().length > CATEGORY_DESCRIPTION_MAX_LENGTH) {
    return `Description must be ${CATEGORY_DESCRIPTION_MAX_LENGTH} characters or fewer.`;
  }

  return null;
}

export function validateCategoryColor(color: string): string | null {
  if (!isCategoryColorToken(color)) {
    return 'Select a color from the palette.';
  }

  return null;
}

export function validateCategoryIcon(icon: string): string | null {
  if (!isCategoryIconName(icon)) {
    return 'Select an icon from the list.';
  }

  return null;
}

export { validateCategoryType };
