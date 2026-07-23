export const CATEGORY_COLOR_TOKENS = [
  'red-200',
  'orange-200',
  'amber-200',
  'yellow-200',
  'lime-200',
  'green-200',
  'emerald-200',
  'teal-200',
  'cyan-200',
  'sky-200',
  'blue-200',
  'indigo-200',
  'violet-200',
  'purple-200',
  'fuchsia-200',
  'pink-200',
  'rose-200',
  'red-300',
  'orange-300',
  'amber-300',
  'green-300',
  'teal-300',
  'cyan-300',
  'blue-300',
  'indigo-300',
  'violet-300',
  'purple-300',
  'pink-300',
  'rose-300',
  'sky-300',
] as const;

export type CategoryColorToken = (typeof CATEGORY_COLOR_TOKENS)[number];

const CATEGORY_COLOR_TOKEN_SET = new Set<string>(CATEGORY_COLOR_TOKENS);

export const CATEGORY_COLOR_PILL_CLASSES: Record<CategoryColorToken, string> = {
  'red-200': 'bg-red-200 text-red-800 dark:bg-red-950 dark:text-red-300',
  'orange-200': 'bg-orange-200 text-orange-800 dark:bg-orange-950 dark:text-orange-300',
  'amber-200': 'bg-amber-200 text-amber-800 dark:bg-amber-950 dark:text-amber-300',
  'yellow-200': 'bg-yellow-200 text-yellow-800 dark:bg-yellow-950 dark:text-yellow-300',
  'lime-200': 'bg-lime-200 text-lime-800 dark:bg-lime-950 dark:text-lime-300',
  'green-200': 'bg-green-200 text-green-800 dark:bg-green-950 dark:text-green-300',
  'emerald-200': 'bg-emerald-200 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300',
  'teal-200': 'bg-teal-200 text-teal-800 dark:bg-teal-950 dark:text-teal-300',
  'cyan-200': 'bg-cyan-200 text-cyan-800 dark:bg-cyan-950 dark:text-cyan-300',
  'sky-200': 'bg-sky-200 text-sky-800 dark:bg-sky-950 dark:text-sky-300',
  'blue-200': 'bg-blue-200 text-blue-800 dark:bg-blue-950 dark:text-blue-300',
  'indigo-200': 'bg-indigo-200 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300',
  'violet-200': 'bg-violet-200 text-violet-800 dark:bg-violet-950 dark:text-violet-300',
  'purple-200': 'bg-purple-200 text-purple-800 dark:bg-purple-950 dark:text-purple-300',
  'fuchsia-200': 'bg-fuchsia-200 text-fuchsia-800 dark:bg-fuchsia-950 dark:text-fuchsia-300',
  'pink-200': 'bg-pink-200 text-pink-800 dark:bg-pink-950 dark:text-pink-300',
  'rose-200': 'bg-rose-200 text-rose-800 dark:bg-rose-950 dark:text-rose-300',
  'red-300': 'bg-red-300 text-red-900 dark:bg-red-950 dark:text-red-300',
  'orange-300': 'bg-orange-300 text-orange-900 dark:bg-orange-950 dark:text-orange-300',
  'amber-300': 'bg-amber-300 text-amber-900 dark:bg-amber-950 dark:text-amber-300',
  'green-300': 'bg-green-300 text-green-900 dark:bg-green-950 dark:text-green-300',
  'teal-300': 'bg-teal-300 text-teal-900 dark:bg-teal-950 dark:text-teal-300',
  'cyan-300': 'bg-cyan-300 text-cyan-900 dark:bg-cyan-950 dark:text-cyan-300',
  'blue-300': 'bg-blue-300 text-blue-900 dark:bg-blue-950 dark:text-blue-300',
  'indigo-300': 'bg-indigo-300 text-indigo-900 dark:bg-indigo-950 dark:text-indigo-300',
  'violet-300': 'bg-violet-300 text-violet-900 dark:bg-violet-950 dark:text-violet-300',
  'purple-300': 'bg-purple-300 text-purple-900 dark:bg-purple-950 dark:text-purple-300',
  'pink-300': 'bg-pink-300 text-pink-900 dark:bg-pink-950 dark:text-pink-300',
  'rose-300': 'bg-rose-300 text-rose-900 dark:bg-rose-950 dark:text-rose-300',
  'sky-300': 'bg-sky-300 text-sky-900 dark:bg-sky-950 dark:text-sky-300',
};

export const CATEGORY_COLOR_SWATCH_CLASSES: Record<CategoryColorToken, string> = {
  'red-200': 'bg-red-200 dark:bg-red-800',
  'orange-200': 'bg-orange-200 dark:bg-orange-800',
  'amber-200': 'bg-amber-200 dark:bg-amber-800',
  'yellow-200': 'bg-yellow-200 dark:bg-yellow-800',
  'lime-200': 'bg-lime-200 dark:bg-lime-800',
  'green-200': 'bg-green-200 dark:bg-green-800',
  'emerald-200': 'bg-emerald-200 dark:bg-emerald-800',
  'teal-200': 'bg-teal-200 dark:bg-teal-800',
  'cyan-200': 'bg-cyan-200 dark:bg-cyan-800',
  'sky-200': 'bg-sky-200 dark:bg-sky-800',
  'blue-200': 'bg-blue-200 dark:bg-blue-800',
  'indigo-200': 'bg-indigo-200 dark:bg-indigo-800',
  'violet-200': 'bg-violet-200 dark:bg-violet-800',
  'purple-200': 'bg-purple-200 dark:bg-purple-800',
  'fuchsia-200': 'bg-fuchsia-200 dark:bg-fuchsia-800',
  'pink-200': 'bg-pink-200 dark:bg-pink-800',
  'rose-200': 'bg-rose-200 dark:bg-rose-800',
  'red-300': 'bg-red-300 dark:bg-red-700',
  'orange-300': 'bg-orange-300 dark:bg-orange-700',
  'amber-300': 'bg-amber-300 dark:bg-amber-700',
  'green-300': 'bg-green-300 dark:bg-green-700',
  'teal-300': 'bg-teal-300 dark:bg-teal-700',
  'cyan-300': 'bg-cyan-300 dark:bg-cyan-700',
  'blue-300': 'bg-blue-300 dark:bg-blue-700',
  'indigo-300': 'bg-indigo-300 dark:bg-indigo-700',
  'violet-300': 'bg-violet-300 dark:bg-violet-700',
  'purple-300': 'bg-purple-300 dark:bg-purple-700',
  'pink-300': 'bg-pink-300 dark:bg-pink-700',
  'rose-300': 'bg-rose-300 dark:bg-rose-700',
  'sky-300': 'bg-sky-300 dark:bg-sky-700',
};

export function isCategoryColorToken(value: string): value is CategoryColorToken {
  return CATEGORY_COLOR_TOKEN_SET.has(value);
}

export function getDefaultCategoryColor(id: string): CategoryColorToken {
  let hash = 0;

  for (let index = 0; index < id.length; index += 1) {
    hash = (hash + id.charCodeAt(index)) | 0;
  }

  const paletteIndex = Math.abs(hash) % CATEGORY_COLOR_TOKENS.length;
  return CATEGORY_COLOR_TOKENS[paletteIndex];
}

export function getCategoryPillClasses(color: CategoryColorToken): string {
  return CATEGORY_COLOR_PILL_CLASSES[color];
}

export function getCategorySwatchClasses(color: CategoryColorToken): string {
  return CATEGORY_COLOR_SWATCH_CLASSES[color];
}

export function getCategoryChartColorTheme(
  color: CategoryColorToken,
): Record<'light' | 'dark', string> {
  const separatorIndex = color.lastIndexOf('-');
  const hue = color.slice(0, separatorIndex);
  const shade = color.slice(separatorIndex + 1);
  const darkShade = shade === '200' ? '800' : shade === '300' ? '700' : shade;

  return {
    light: `var(--color-${color})`,
    dark: `var(--color-${hue}-${darkShade})`,
  };
}
