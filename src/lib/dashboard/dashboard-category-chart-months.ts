import { parseCalendarDayKey } from '@/lib/dates/calendar-day-key';
import { getReportMonthBounds } from '@/lib/reports/report-month';

export const DASHBOARD_CATEGORY_CHART_PAST_MONTHS = 6;

const chartMonthLabelFormatter = new Intl.DateTimeFormat('en-GB', {
  month: 'short',
});

export type DashboardCategoryChartMonthRange = {
  monthDateFrom: string;
  dateFrom: string;
  dateTo: string;
};

export type CategoryMonthlySpendingRow = {
  categoryId: string | null;
  monthDateFrom: string;
  total: string;
};

export type CategoryMonthlySpendingPoint = {
  monthDateFrom: string;
  monthLabel: string;
  amount: number;
};

export function getDashboardCategoryChartMonthRanges(
  reportDateFrom: string,
  pastMonths = DASHBOARD_CATEGORY_CHART_PAST_MONTHS,
): DashboardCategoryChartMonthRange[] {
  const parsed = parseCalendarDayKey(reportDateFrom);

  if (!parsed) {
    return [];
  }

  const ranges: DashboardCategoryChartMonthRange[] = [];

  for (let offset = pastMonths; offset >= 0; offset -= 1) {
    const monthStart = new Date(
      parsed.getFullYear(),
      parsed.getMonth() - offset,
      1,
    );
    const bounds = getReportMonthBounds(
      monthStart.getFullYear(),
      monthStart.getMonth() + 1,
    );

    ranges.push({
      monthDateFrom: bounds.dateFrom,
      dateFrom: bounds.dateFrom,
      dateTo: bounds.dateTo,
    });
  }

  return ranges;
}

export function formatDashboardCategoryChartMonthLabel(
  monthDateFrom: string,
): string {
  const parsed = parseCalendarDayKey(monthDateFrom);

  if (!parsed) {
    return monthDateFrom;
  }

  return chartMonthLabelFormatter.format(parsed);
}

export function buildCategoryMonthlySpendingSeries(
  rows: CategoryMonthlySpendingRow[],
  categoryId: string | null,
  monthRanges: DashboardCategoryChartMonthRange[],
): CategoryMonthlySpendingPoint[] {
  const totalsByMonth = new Map(
    rows
      .filter((row) => row.categoryId === categoryId)
      .map((row) => [row.monthDateFrom, row.total]),
  );

  return monthRanges.map((range) => {
    const rawTotal = totalsByMonth.get(range.monthDateFrom) ?? '0';
    const amount = Math.abs(Number(rawTotal));

    return {
      monthDateFrom: range.monthDateFrom,
      monthLabel: formatDashboardCategoryChartMonthLabel(range.monthDateFrom),
      amount: Number.isFinite(amount) ? amount : 0,
    };
  });
}

export function hasCategoryMonthlySpending(
  series: CategoryMonthlySpendingPoint[],
): boolean {
  return series.some((point) => point.amount > 0);
}
