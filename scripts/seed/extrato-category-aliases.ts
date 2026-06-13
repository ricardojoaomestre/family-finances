import { categoryNameKey } from '@/lib/categories/import/category-name-key';

export const EXTRATO_CATEGORY_ALIASES: Record<string, string> = {
  [categoryNameKey('Agua')]: 'Água',
  [categoryNameKey('Casa (crédito habitação + condomínio)')]:
    'Casa / Crédito Habitação / Condomínio',
  [categoryNameKey('Combustivel')]: 'Combustível',
  [categoryNameKey('Comissoes bancárias')]: 'Comissões Bancárias',
  [categoryNameKey('Comissoes bancárias ')]: 'Comissões Bancárias',
  [categoryNameKey('Convivio Restaurantes')]: 'Convívio / Restaurantes',
  [categoryNameKey('Despesas médicas e farmácia')]:
    'Despesas Médicas / Farmácia',
  [categoryNameKey('Escola (filhos)')]: 'Escola',
  [categoryNameKey('Internet + Telemovel')]: 'Internet + Telemóvel',
  [categoryNameKey('Manutenção e decoração')]: 'Manutenção / Decoração',
  [categoryNameKey('Pag/Rec. Estado')]: 'Pagamentos ao Estado',
  [categoryNameKey('Portagens e estacionamento e transportes')]:
    'Transportes / Portagens / Estacionamento',
  [categoryNameKey('Poupança ppr joana')]: 'PPR Joana',
  [categoryNameKey('Presentes (brinquedos, jogos)')]:
    'Presentes / Brinquedos / Jogos',
};
