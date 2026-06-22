export function validateBudgetAmount(amount: string): string | null {
  const trimmed = amount.trim();

  if (!trimmed) {
    return 'Amount is required.';
  }

  const normalized = trimmed.replace(',', '.');
  const parsed = Number(normalized);

  if (!Number.isFinite(parsed) || parsed <= 0) {
    return 'Enter a positive amount.';
  }

  const decimalPart = normalized.split('.')[1];

  if (decimalPart && decimalPart.length > 2) {
    return 'Use at most two decimal places.';
  }

  return null;
}

export function normalizeBudgetAmount(amount: string): string {
  return Number(amount.trim().replace(',', '.')).toFixed(2);
}
