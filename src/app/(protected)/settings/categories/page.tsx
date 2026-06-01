import { CategoriesManager } from '@/app/(protected)/settings/categories/components/categories-manager';
import { getCategories } from '@/lib/categories/get-categories';
import { getCategoryImportSnapshotMeta } from '@/lib/categories/get-category-import-snapshot-meta';

export default async function CategoriesSettingsPage() {
  const [categories, importSnapshot] = await Promise.all([
    getCategories(),
    getCategoryImportSnapshotMeta(),
  ]);

  return (
    <CategoriesManager
      categories={categories}
      importSnapshot={importSnapshot}
    />
  );
}
