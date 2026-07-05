import { DashboardPageContent } from '@/app/(protected)/dashboard/components/dashboard-page-content';
import { auth } from '@/auth';
import { getCategoryBudgetProgressRows } from '@/lib/budgets/get-category-budget-progress';
import { buildDashboardMonthStats } from '@/lib/dashboard/build-dashboard-month-stats';
import { getDefaultDashboardMonthRange } from '@/lib/dashboard/dashboard-date-range';
import { getMonthReportCategoryTotals } from '@/lib/reports/get-month-report-category-totals';
import { parseMonthReportSearchParams } from '@/lib/reports/month-report-search-params';
import { getPreviousCalendarMonthRange } from '@/lib/reports/report-month';
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

  const previousRange = getPreviousCalendarMonthRange(monthRange.dateFrom);

  const [currentTotals, previousTotals] = await Promise.all([
    getMonthReportCategoryTotals(monthRange.dateFrom, monthRange.dateTo),
    previousRange
      ? getMonthReportCategoryTotals(
          previousRange.dateFrom,
          previousRange.dateTo,
        )
      : Promise.resolve([]),
  ]);

  const [stats, budgetProgress] = await Promise.all([
    Promise.resolve(
      buildDashboardMonthStats(
        monthRange.dateFrom,
        currentTotals,
        previousRange ? previousTotals : null,
      ),
    ),
    getCategoryBudgetProgressRows(currentTotals),
  ]);

  return (
    <DashboardPageContent
      welcomeMessage={`Welcome, ${session?.user?.name ?? session?.user?.email}`}
      monthRange={monthRange}
      stats={stats}
      budgetProgress={budgetProgress}
    />
  );
}
