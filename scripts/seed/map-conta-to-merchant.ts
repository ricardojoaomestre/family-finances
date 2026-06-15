import type { MerchantSlug } from '@/lib/merchants';

const CONTA_TO_MERCHANT: Record<string, MerchantSlug> = {
  'Débito - Joana': 'activo-debito-joana',
  'Débito - Ricardo': 'activo-debito-ricardo',
  'Crédito - Ricardo': 'activo-credito-ricardo',
  Débito: 'santander-debito',
  Crédito: 'santander-credito',
  Refeição: 'coverflex',
  BPI: 'bpi',
  Ticket: 'ticket',
};

export function mapContaToMerchant(conta: string): MerchantSlug | null {
  const trimmed = conta.trim();

  if (!trimmed) {
    return null;
  }

  return CONTA_TO_MERCHANT[trimmed] ?? null;
}
