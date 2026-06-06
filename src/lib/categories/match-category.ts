export type CategoryRule = {
  id: string;
  pattern: string | null;
};

function getMatchLength(pattern: string, description: string): number | null {
  try {
    const match = new RegExp(pattern, 'i').exec(description);

    if (!match) {
      return null;
    }

    return match[0].length;
  } catch {
    return null;
  }
}

export function matchCategoryId(
  description: string,
  rules: CategoryRule[],
): string | null {
  let bestId: string | null = null;
  let bestLength = -1;

  for (const rule of rules) {
    const pattern = rule.pattern?.trim();

    if (!pattern) {
      continue;
    }

    const matchLength = getMatchLength(pattern, description);

    if (matchLength === null || matchLength <= bestLength) {
      continue;
    }

    bestLength = matchLength;
    bestId = rule.id;
  }

  return bestId;
}
