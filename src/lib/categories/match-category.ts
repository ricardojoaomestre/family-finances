export type CategoryRule = {
  id: string;
  pattern: string | null;
};

export type CompiledCategoryRule = {
  id: string;
  regex: RegExp;
};

/**
 * Compile each rule's pattern into a RegExp once so callers matching many
 * descriptions (e.g. a full spreadsheet import) don't recompile the same
 * patterns per row. Rules without a usable pattern, or whose pattern fails to
 * compile, are dropped — matching the previous "invalid pattern never matches"
 * behavior.
 */
export function compileCategoryRules(
  rules: CategoryRule[],
): CompiledCategoryRule[] {
  const compiled: CompiledCategoryRule[] = [];

  for (const rule of rules) {
    const pattern = rule.pattern?.trim();

    if (!pattern) {
      continue;
    }

    try {
      compiled.push({ id: rule.id, regex: new RegExp(pattern, 'i') });
    } catch {
      // Invalid pattern: skip it (it could never have matched).
    }
  }

  return compiled;
}

export function matchCategoryIdWithCompiledRules(
  description: string,
  compiledRules: CompiledCategoryRule[],
): string | null {
  let bestId: string | null = null;
  let bestLength = -1;

  for (const rule of compiledRules) {
    const match = rule.regex.exec(description);

    if (!match || match[0].length <= bestLength) {
      continue;
    }

    bestLength = match[0].length;
    bestId = rule.id;
  }

  return bestId;
}

export function matchCategoryId(
  description: string,
  rules: CategoryRule[],
): string | null {
  return matchCategoryIdWithCompiledRules(
    description,
    compileCategoryRules(rules),
  );
}
