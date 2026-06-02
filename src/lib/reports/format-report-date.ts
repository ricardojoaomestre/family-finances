const reportDateFormatter = new Intl.DateTimeFormat('en-GB', {
  dateStyle: 'medium',
});

export function formatReportDate(date: string): string {
  const [year, month, day] = date.split('-').map(Number);

  if (!year || !month || !day) {
    return date;
  }

  return reportDateFormatter.format(new Date(year, month - 1, day));
}
