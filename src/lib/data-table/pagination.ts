export const DATA_TABLE_PAGE_SIZE_OPTIONS = [25, 50, 100, 200] as const;

export type DataTablePageSize = (typeof DATA_TABLE_PAGE_SIZE_OPTIONS)[number];

export const DATA_TABLE_DEFAULT_PAGE_SIZE: DataTablePageSize = 25;

export function isDataTablePageSize(value: number): value is DataTablePageSize {
  return (DATA_TABLE_PAGE_SIZE_OPTIONS as readonly number[]).includes(value);
}
