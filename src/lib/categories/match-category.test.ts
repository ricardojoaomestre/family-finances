import { describe, expect, it } from 'vitest';

import { matchCategoryId } from '@/lib/categories/match-category';

describe('matchCategoryId', () => {
  const fuelRule = {
    id: 'fuel',
    pattern: '(repsol|\\bbp\\b|\\bgalp\\b|\\bprio\\b|cepsa|est\\s*servico|a\\s*s\\s*aveiras)',
  };

  const bankFeesRule = {
    id: 'bank-fees',
    pattern:
      '(comiss[aã]o|imposto\\s*do\\s*selo|manuten[cç][aã]o\\s*de\\s*conta|reembolso\\s*123|bonif)',
  };

  it('prefers the longest matching rule over higher-priority short-token matches', () => {
    const rules = [fuelRule, bankFeesRule];

    expect(
      matchCategoryId('MANUTENCAO DE CONTA VALOR BPI ABR 2026', rules),
    ).toBe('bank-fees');
  });

  it('prefers bank-fees phrase over restaurant rest substring', () => {
    const restaurantRule = {
      id: 'restaurant',
      pattern: 'rest|restaura',
    };
    const loanInterestRule = {
      id: 'bank-fees',
      pattern: 'juros\\s*de\\s*emprestimo',
    };

    expect(
      matchCategoryId('JUROS DE EMPRESTIMO - 006526001-165-001', [
        restaurantRule,
        loanInterestRule,
      ]),
    ).toBe('bank-fees');
  });

  it('still matches higher-priority rules when they are the only match', () => {
    const rules = [fuelRule, bankFeesRule];

    expect(matchCategoryId('COMPRA GALP ESTACAO SERVICO', rules)).toBe('fuel');
  });

  it('uses priority order as a tiebreaker when match lengths are equal', () => {
    const rules = [
      { id: 'first', pattern: 'uber' },
      { id: 'second', pattern: 'uber' },
    ];

    expect(matchCategoryId('UBER TRIP LISBOA', rules)).toBe('first');
  });

  it('returns null when no rules match', () => {
    expect(
      matchCategoryId('UNKNOWN MERCHANT', [{ id: 'fuel', pattern: 'galp' }]),
    ).toBeNull();
  });

  it('skips rules with empty or invalid patterns', () => {
    expect(
      matchCategoryId('GALP', [
        { id: 'empty', pattern: '' },
        { id: 'invalid', pattern: '(' },
        fuelRule,
      ]),
    ).toBe('fuel');
  });
});
