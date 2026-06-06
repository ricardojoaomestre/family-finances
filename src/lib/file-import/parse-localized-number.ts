import parseDecimalNumber from "parse-decimal-number";

const EU_NUMBER_OPTIONS = { thousands: ".", decimal: "," } as const;
const US_NUMBER_OPTIONS = { thousands: ",", decimal: "." } as const;

const parseEuDecimal = parseDecimalNumber.withOptions(EU_NUMBER_OPTIONS);
const parseUsDecimal = parseDecimalNumber.withOptions(US_NUMBER_OPTIONS);

const MULTI_CHAR_CURRENCY = /(?:R\$|US\$|A\$|C\$|NZ\$|S\$|HK\$|MX\$)/gi;

const ISO_CURRENCY_CODES =
  "EUR|USD|GBP|CHF|JPY|CNY|BRL|AUD|CAD|NZD|SEK|NOK|DKK|PLN|CZK|HUF|RON|BGN|HRK|ISK|INR|RUB|ZAR|MXN|SGD|HKD|KRW|TRY|ILS|THB|PHP|IDR|MYR|VND|AED|SAR";

const ISO_CURRENCY_PATTERN = new RegExp(`(?:${ISO_CURRENCY_CODES})`, "gi");

const SHORT_CURRENCY_PATTERN = /\bkr\.?\b|\bzł\b/gi;

const SPACE_SEPARATORS = /[\s\u00A0\u202F\u2000-\u200A\u205F\u3000]/g;

function stripCurrency(value: string): string {
  return value
    .replace(MULTI_CHAR_CURRENCY, "")
    .replace(/\p{Sc}/gu, "")
    .replace(/%/g, "")
    .replace(ISO_CURRENCY_PATTERN, "")
    .replace(SHORT_CURRENCY_PATTERN, "");
}

function compactNumber(value: string): string {
  return value.replace(SPACE_SEPARATORS, "");
}

function parseFiniteDecimal(
  parser: (value: string) => number,
  value: string,
): number | null {
  const parsed = parser(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function parseNormalizedNumber(normalized: string): number | null {
  const compact = compactNumber(normalized);
  if (!compact) return null;

  const lastComma = compact.lastIndexOf(",");
  const lastDot = compact.lastIndexOf(".");

  if (lastComma !== -1 && lastDot !== -1) {
    return lastComma > lastDot
      ? parseFiniteDecimal(parseEuDecimal, compact)
      : parseFiniteDecimal(parseUsDecimal, compact);
  }

  if (lastComma !== -1) {
    const fraction = compact.slice(lastComma + 1);
    return /^\d{1,2}$/.test(fraction)
      ? parseFiniteDecimal(parseEuDecimal, compact)
      : parseFiniteDecimal(parseUsDecimal, compact);
  }

  if (lastDot !== -1) {
    const fraction = compact.slice(lastDot + 1);
    return /^\d{1,2}$/.test(fraction)
      ? parseFiniteDecimal(parseUsDecimal, compact)
      : parseFiniteDecimal(parseEuDecimal, compact);
  }

  const parsed = Number(compact);
  return Number.isFinite(parsed) ? parsed : null;
}

export function parseLocalizedNumber(raw: string): number | null {
  let normalized = raw.trim();
  if (!normalized) return null;

  if (normalized.startsWith('(') && normalized.endsWith(')')) {
    normalized = `-${normalized.slice(1, -1).trim()}`;
  }

  if (normalized.startsWith('--')) {
    normalized = `-${normalized.slice(2).trimStart()}`;
  }

  normalized = stripCurrency(normalized);

  return parseNormalizedNumber(normalized);
}
