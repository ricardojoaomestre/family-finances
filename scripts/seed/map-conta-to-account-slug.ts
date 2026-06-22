const CONTA_TO_ACCOUNT_SLUG: Record<string, string> = {
  'Débito - Joana': 'activo-debito-joana',
  'Débito - Ricardo': 'activo-debito-ricardo',
  'Crédito - Ricardo': 'activo-credito-ricardo',
  Débito: 'santander-debito',
  Crédito: 'santander-credito',
  Refeição: 'coverflex',
  BPI: 'bpi',
  Ticket: 'ticket',
};

export function mapContaToAccountSlug(conta: string): string | null {
  const trimmed = conta.trim();

  if (!trimmed) {
    return null;
  }

  return CONTA_TO_ACCOUNT_SLUG[trimmed] ?? null;
}
