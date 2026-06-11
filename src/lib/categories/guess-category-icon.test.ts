import { describe, expect, it } from 'vitest';

import { guessCategoryIcon } from '@/lib/categories/category-icons';

describe('guessCategoryIcon', () => {
  it('matches Portuguese grocery names', () => {
    expect(guessCategoryIcon('Supermercado')).toBe('shopping-cart');
    expect(guessCategoryIcon('Alimentação')).toBe('shopping-cart');
  });

  it('matches English fuel and restaurant names', () => {
    expect(guessCategoryIcon('fuel')).toBe('fuel');
    expect(guessCategoryIcon('Restaurant')).toBe('utensils');
  });

  it('prefers longer keyword matches', () => {
    expect(guessCategoryIcon('MANUTENCAO DE CONTA')).toBe('landmark');
  });

  it('returns tag for unknown names', () => {
    expect(guessCategoryIcon('Misc')).toBe('tag');
  });
});
