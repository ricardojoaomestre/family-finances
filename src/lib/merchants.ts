export const MERCHANTS = {
  'activo-credito-ricardo': 'Activo Bank - crédito - Ricardo',
  'activo-debito-joana': 'Activo Bank - débito - Joana',
  'activo-debito-ricardo': 'Activo Bank - débito - Ricardo',
  bpi: 'BPI',
  coverflex: 'Coverflex',
  'santander-credito': 'Santander - crédito',
  'santander-debito': 'Santander - débito',
  'santander-refeicao': 'Santander - cartão refeição',
  ticket: 'Ticket',
} as const;

export type MerchantSlug = keyof typeof MERCHANTS;

const merchantSlugs = new Set<string>(Object.keys(MERCHANTS));

export function isMerchantSlug(value: string): value is MerchantSlug {
  return merchantSlugs.has(value);
}

export function getMerchantLabel(slug: MerchantSlug): string {
  return MERCHANTS[slug];
}

export function getMerchantLabelOrSlug(slug: string): string {
  return isMerchantSlug(slug) ? getMerchantLabel(slug) : slug;
}

export const MERCHANTS_SORTED_BY_LABEL = (
  Object.entries(MERCHANTS) as Array<[MerchantSlug, string]>
)
  .map(([slug, label]) => ({ slug, label }))
  .sort((a, b) => a.label.localeCompare(b.label, 'pt'));
