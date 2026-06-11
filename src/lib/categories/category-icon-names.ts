export const CATEGORY_ICON_NAMES = [
  'shopping-cart',
  'utensils',
  'fuel',
  'car',
  'bus',
  'heart-pulse',
  'pill',
  'graduation-cap',
  'zap',
  'house',
  'ticket',
  'repeat',
  'shirt',
  'paw-print',
  'plane',
  'gift',
  'shield',
  'landmark',
  'wallet',
  'arrow-left-right',
  'piggy-bank',
  'receipt',
  'smartphone',
  'dumbbell',
  'baby',
  'wrench',
  'hand-heart',
  'banknote',
  'tag',
] as const;

export type CategoryIconName = (typeof CATEGORY_ICON_NAMES)[number];

const CATEGORY_ICON_NAME_SET = new Set<string>(CATEGORY_ICON_NAMES);

const CATEGORY_ICON_RULES: readonly {
  icon: CategoryIconName;
  keywords: readonly string[];
}[] = [
  {
    icon: 'shopping-cart',
    keywords: [
      'supermercado',
      'continente',
      'pingo doce',
      'pingo',
      'groceries',
      'grocery',
      'mercado',
      'alimentacao',
      'alimentar',
      'minipreco',
      'lidl',
      'aldi',
      'auchan',
      'intermarche',
    ],
  },
  {
    icon: 'utensils',
    keywords: [
      'restaurante',
      'restauracao',
      'restaura',
      'restaurant',
      'takeaway',
      'uber eats',
      'bolt food',
      'glovo',
      'cafeteria',
      'snack',
      'mcdonalds',
      'burger',
    ],
  },
  {
    icon: 'fuel',
    keywords: [
      'combustivel',
      'gasolina',
      'gasoleo',
      'repsol',
      'galp',
      'prio',
      'cepsa',
      'est servico',
      'fuel',
      'posto',
    ],
  },
  {
    icon: 'car',
    keywords: [
      'uber',
      'bolt',
      'taxi',
      'transporte',
      'estacionamento',
      'parking',
      'via verde',
      'autoestrada',
      'portagem',
      'car',
    ],
  },
  { icon: 'bus', keywords: ['metro', 'autocarro', 'cp', 'carris', 'bus', 'comboio'] },
  {
    icon: 'heart-pulse',
    keywords: [
      'saude',
      'medico',
      'hospital',
      'clinica',
      'dentista',
      'health',
      'mutuelle',
    ],
  },
  { icon: 'pill', keywords: ['farmacia', 'pharmacy', 'wells'] },
  {
    icon: 'graduation-cap',
    keywords: [
      'escola',
      'universidade',
      'educacao',
      'education',
      'curso',
      'formacao',
    ],
  },
  {
    icon: 'zap',
    keywords: [
      'luz',
      'eletricidade',
      'agua',
      'gas',
      'edp',
      'energia',
      'utilities',
      'utility',
    ],
  },
  {
    icon: 'house',
    keywords: ['casa', 'renda', 'condominio', 'home', 'habitacao', 'hipoteca'],
  },
  {
    icon: 'ticket',
    keywords: [
      'cinema',
      'lazer',
      'netflix',
      'spotify',
      'disney',
      'entertainment',
      'concerto',
    ],
  },
  {
    icon: 'repeat',
    keywords: ['subscricao', 'subscription', 'mensalidade', 'recurring'],
  },
  { icon: 'shirt', keywords: ['roupa', 'vestuario', 'clothing', 'zara', 'h&m'] },
  {
    icon: 'paw-print',
    keywords: ['animal', 'veterinario', 'pet', 'cao', 'gato'],
  },
  {
    icon: 'plane',
    keywords: ['viagem', 'hotel', 'airbnb', 'travel', 'voo', 'flight'],
  },
  { icon: 'gift', keywords: ['presente', 'gift', 'oferta'] },
  { icon: 'shield', keywords: ['seguro', 'insurance', 'allianz', 'fidelidade'] },
  {
    icon: 'landmark',
    keywords: [
      'comissao',
      'banco',
      'manutencao de conta',
      'bank',
      'bank-fees',
      'juros',
      'emprestimo',
      'loan',
    ],
  },
  {
    icon: 'wallet',
    keywords: ['salario', 'ordenado', 'rendimento', 'income', 'vencimento'],
  },
  {
    icon: 'arrow-left-right',
    keywords: ['transferencia', 'transfer', 'trf', 'movimento'],
  },
  {
    icon: 'piggy-bank',
    keywords: ['poupanca', 'investimento', 'saving', 'savings', 'degiro'],
  },
  {
    icon: 'receipt',
    keywords: ['imposto', 'irs', 'selo', 'tax', 'taxes', 'financas'],
  },
  {
    icon: 'smartphone',
    keywords: ['telemovel', 'telefone', 'meo', 'vodafone', 'nos', 'mobile'],
  },
  { icon: 'dumbbell', keywords: ['ginasio', 'gym', 'desporto', 'sport', 'fitness'] },
  { icon: 'baby', keywords: ['filho', 'filha', 'creche', 'fraldas', 'baby', 'kids'] },
  { icon: 'wrench', keywords: ['obras', 'bricolage', 'leroy', 'reparacao', 'diy'] },
  {
    icon: 'hand-heart',
    keywords: ['donativo', 'caridade', 'charity', 'ong'],
  },
  {
    icon: 'banknote',
    keywords: ['levantamento', 'multibanco', 'atm', 'cash', 'numerario'],
  },
];

export function isCategoryIconName(value: string): value is CategoryIconName {
  return CATEGORY_ICON_NAME_SET.has(value);
}

export function resolveCategoryIcon(value: string): CategoryIconName {
  return isCategoryIconName(value) ? value : 'tag';
}

export function normalizeCategoryNameForIconMatch(name: string): string {
  return name
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .trim();
}

export function guessCategoryIcon(name: string): CategoryIconName {
  const normalized = normalizeCategoryNameForIconMatch(name);

  if (!normalized) {
    return 'tag';
  }

  let best: { icon: CategoryIconName; length: number } | null = null;

  for (const rule of CATEGORY_ICON_RULES) {
    for (const keyword of rule.keywords) {
      const normalizedKeyword = normalizeCategoryNameForIconMatch(keyword);

      if (
        normalizedKeyword &&
        normalized.includes(normalizedKeyword) &&
        (!best || normalizedKeyword.length > best.length)
      ) {
        best = { icon: rule.icon, length: normalizedKeyword.length };
      }
    }
  }

  return best?.icon ?? 'tag';
}
