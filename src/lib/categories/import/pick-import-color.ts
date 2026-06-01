import {
  CATEGORY_COLOR_TOKENS,
  type CategoryColorToken,
} from '@/lib/categories/category-colors';

export function pickCategoryImportColor(
  usedByActive: Set<string>,
): CategoryColorToken {
  const firstFree = CATEGORY_COLOR_TOKENS.find(
    (token) => !usedByActive.has(token),
  );

  if (firstFree) {
    return firstFree;
  }

  const index = Math.floor(Math.random() * CATEGORY_COLOR_TOKENS.length);
  return CATEGORY_COLOR_TOKENS[index]!;
}
