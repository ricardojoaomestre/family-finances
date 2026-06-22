import { BudgetsManager } from '@/app/(protected)/settings/budgets/components/budgets-manager';
import { getBudgets } from '@/lib/budgets/get-budgets';
import { getCategories } from '@/lib/categories/get-categories';

export default async function BudgetsSettingsPage() {
  const [budgets, categories] = await Promise.all([
    getBudgets(),
    getCategories(),
  ]);

  return <BudgetsManager budgets={budgets} categories={categories} />;
}
