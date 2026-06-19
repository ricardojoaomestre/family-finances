import { db } from '@/db';
import { categories } from '@/db/schema';
import type { CategoryColorToken } from '@/lib/categories/category-colors';
import type { CategoryIconName } from '@/lib/categories/category-icons';
import type { CategoryType } from '@/lib/categories/category-type';

type DefaultCategory = {
  name: string;
  type: CategoryType;
  color: CategoryColorToken;
  icon: CategoryIconName;
};

export const DEFAULT_HOUSEHOLD_CATEGORIES: DefaultCategory[] = [
  { name: 'Income', type: 'income', color: 'green-300', icon: 'wallet' },
  { name: 'Groceries', type: 'spending', color: 'orange-200', icon: 'shopping-cart' },
  { name: 'Dining', type: 'spending', color: 'red-200', icon: 'utensils' },
  { name: 'Transport', type: 'spending', color: 'yellow-200', icon: 'car' },
  { name: 'Housing', type: 'spending', color: 'purple-300', icon: 'house' },
  { name: 'Utilities', type: 'spending', color: 'sky-300', icon: 'zap' },
  { name: 'Health', type: 'spending', color: 'cyan-200', icon: 'pill' },
  { name: 'Shopping', type: 'spending', color: 'amber-200', icon: 'gift' },
  { name: 'Subscriptions', type: 'spending', color: 'blue-200', icon: 'repeat' },
  { name: 'Savings', type: 'saving', color: 'pink-200', icon: 'piggy-bank' },
  { name: 'Transfers', type: 'transfer', color: 'indigo-200', icon: 'arrow-left-right' },
];

export async function seedDefaultCategoriesForHousehold(
  householdId: string,
): Promise<void> {
  const now = new Date();

  await db.insert(categories).values(
    DEFAULT_HOUSEHOLD_CATEGORIES.map((category, index) => ({
      householdId,
      name: category.name,
      description: null,
      color: category.color,
      icon: category.icon,
      pattern: null,
      priority: index + 1,
      active: true,
      type: category.type,
      createdAt: now,
      updatedAt: now,
    })),
  );
}
