import { DashboardPageContent } from '@/app/(protected)/dashboard/components/dashboard-page-content';
import { auth } from '@/auth';
import { getCategories } from '@/lib/categories/get-categories';
import { isSpendingCategoryType } from '@/lib/categories/category-type';
import { toCategoryOptions } from '@/lib/categories/to-category-options';
import { getDefaultDashboardMonthRange } from '@/lib/dashboard/dashboard-date-range';
import { getCategoryMonthlySpending } from '@/lib/dashboard/get-category-monthly-spending';
import { getDashboardMonthStats } from '@/lib/dashboard/get-dashboard-month-stats';
import { parseMonthReportSearchParams } from '@/lib/reports/month-report-search-params';
import { validateReportDateRange } from '@/lib/reports/validate-report-date-range';

type DashboardPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function DashboardPage({
  searchParams,
}: DashboardPageProps) {
  const session = await auth();
  const resolvedSearchParams = await searchParams;
  const listParams = parseMonthReportSearchParams(resolvedSearchParams);
  const hasDatesInUrl =
    listParams.dateFrom !== '' || listParams.dateTo !== '';

  let monthRange = getDefaultDashboardMonthRange();

  if (hasDatesInUrl) {
    const validation = validateReportDateRange(
      listParams.dateFrom,
      listParams.dateTo,
    );

    if (validation.ok) {
      monthRange = {
        dateFrom: validation.dateFrom,
        dateTo: validation.dateTo,
      };
    }
  }

  const [stats, categoryRows, categoryMonthlySpending] = await Promise.all([
    getDashboardMonthStats(monthRange.dateFrom, monthRange.dateTo),
    getCategories(),
    getCategoryMonthlySpending(monthRange.dateFrom),
  ]);

  const spendingCategories = toCategoryOptions(
    categoryRows.filter((category) => isSpendingCategoryType(category.type)),
  );

  return (
    <DashboardPageContent
      welcomeMessage={`Welcome, ${session?.user?.name ?? session?.user?.email}`}
      monthRange={monthRange}
      stats={stats}
      spendingCategories={spendingCategories}
      categoryMonthlySpending={categoryMonthlySpending}
    />
  );
}
