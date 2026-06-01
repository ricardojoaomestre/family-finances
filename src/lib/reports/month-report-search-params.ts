export type MonthReportSearchParams = {
  dateFrom: string;
  dateTo: string;
};

function readParam(
  params: Record<string, string | string[] | undefined>,
  key: string,
): string {
  const value = params[key];
  if (Array.isArray(value)) {
    return value[0] ?? '';
  }
  return value ?? '';
}

export function parseMonthReportSearchParams(
  params: Record<string, string | string[] | undefined>,
): MonthReportSearchParams {
  return {
    dateFrom: readParam(params, 'dateFrom'),
    dateTo: readParam(params, 'dateTo'),
  };
}

type BuildMonthReportSearchParamsInput = Partial<MonthReportSearchParams>;

export function buildMonthReportSearchParams(
  current: MonthReportSearchParams,
  updates: BuildMonthReportSearchParamsInput = {},
): string {
  const dateFrom = updates.dateFrom ?? current.dateFrom;
  const dateTo = updates.dateTo ?? current.dateTo;
  const searchParams = new URLSearchParams();

  searchParams.set('dateFrom', dateFrom);
  searchParams.set('dateTo', dateTo);

  return `?${searchParams.toString()}`;
}

export function getDefaultMonthReportSearchParams(): MonthReportSearchParams {
  return {
    dateFrom: '',
    dateTo: '',
  };
}
