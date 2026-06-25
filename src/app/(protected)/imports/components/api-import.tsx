'use client';

import { useRouter } from 'next/navigation';
import {
  useCallback,
  useMemo,
  useState,
  useTransition,
} from 'react';

import { confirmImport } from '@/app/(protected)/dashboard/actions/confirm-import';
import { importBankTransactions } from '@/app/(protected)/dashboard/actions/import-bank-transactions';
import { rematchImportCategories } from '@/app/(protected)/dashboard/actions/import-file';
import {
  getPreviewColumns,
  type PreviewRow,
} from '@/app/(protected)/dashboard/components/import-columns';
import { ImportPreviewSection } from '@/app/(protected)/imports/components/import-preview-section';
import {
  createCategory,
  type CategoryFormInput,
} from '@/app/(protected)/settings/categories/actions/category-actions';
import { CategoryFormSheet } from '@/app/(protected)/settings/categories/components/category-form-sheet';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Combobox } from '@/components/ui/combobox';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { Field, FieldLabel } from '@/components/ui/field';
import { TooltipProvider } from '@/components/ui/tooltip';
import { useImportPreviewState } from '@/hooks/use-import-preview-state';

type LinkedBankAccountOption = {
  id: string;
  label: string;
};

type ApiImportProps = {
  linkedBankAccounts: LinkedBankAccountOption[];
};

export function ApiImport({ linkedBankAccounts }: ApiImportProps) {
  const router = useRouter();
  const [state, dispatch] = useImportPreviewState();
  const {
    parsedData,
    rowValidations,
    includeBalanceColumn,
    categories,
    previewLabel,
    importSource,
    periodFrom,
    periodTo,
    error,
    bankAccountId,
  } = state;
  const [dateRange, setDateRange] = useState({ dateFrom: '', dateTo: '' });
  const [isFetching, startFetchTransition] = useTransition();
  const [isConfirming, startConfirmTransition] = useTransition();
  const [isRematching, startRematchTransition] = useTransition();
  const [createCategoryOpen, setCreateCategoryOpen] = useState(false);
  const [createCategoryPattern, setCreateCategoryPattern] = useState<
    string | null
  >(null);

  const previewRows: PreviewRow[] | null = useMemo(() => {
    if (!parsedData || !rowValidations) return null;

    return parsedData.map((row, index) => ({
      ...row,
      validation: rowValidations[index]!,
    }));
  }, [parsedData, rowValidations]);

  const handleCategoryChange = useCallback(
    (rowIndex: number, categoryId: string | null) => {
      dispatch({ type: 'set-row-category', rowIndex, categoryId });
    },
    [dispatch],
  );

  const handleOpenCreateCategory = useCallback((pattern: string) => {
    setCreateCategoryPattern(pattern);
    setCreateCategoryOpen(true);
  }, []);

  const handleOverrideDuplicate = useCallback(
    (rowIndex: number) => {
      dispatch({ type: 'override-duplicate', rowIndex });
    },
    [dispatch],
  );

  const handleConfirmNoteMatch = useCallback(
    (rowIndex: number) => {
      dispatch({ type: 'confirm-note-match', rowIndex });
    },
    [dispatch],
  );

  const columns = useMemo(
    () =>
      categories
        ? getPreviewColumns(
            includeBalanceColumn,
            categories,
            handleCategoryChange,
            handleOpenCreateCategory,
            handleOverrideDuplicate,
            handleConfirmNoteMatch,
          )
        : [],
    [
      categories,
      includeBalanceColumn,
      handleCategoryChange,
      handleOpenCreateCategory,
      handleOverrideDuplicate,
      handleConfirmNoteMatch,
    ],
  );

  const importableCount =
    previewRows?.filter(
      (row) => row.validation.valid && !row.duplicate.isDuplicate,
    ).length ?? 0;

  const duplicateCount =
    previewRows?.filter(
      (row) => row.validation.valid && row.duplicate.isDuplicate,
    ).length ?? 0;

  const invalidCount =
    previewRows?.filter((row) => !row.validation.valid).length ?? 0;

  const summaryParts = previewRows
    ? [
        `${previewRows.length} row${previewRows.length === 1 ? '' : 's'} fetched`,
        `${importableCount} importable`,
        duplicateCount > 0
          ? `${duplicateCount} duplicate${duplicateCount === 1 ? '' : 's'}`
          : null,
        invalidCount > 0 ? `${invalidCount} invalid` : null,
      ].filter(Boolean)
    : [];

  function handleFetch() {
    if (!bankAccountId || !dateRange.dateFrom || !dateRange.dateTo) {
      return;
    }

    startFetchTransition(async () => {
      dispatch({ type: 'parse-started' });
      const result = await importBankTransactions({
        bankAccountId,
        dateFrom: dateRange.dateFrom,
        dateTo: dateRange.dateTo,
      });

      if (!result.ok) {
        dispatch({ type: 'parse-failed', error: result.error });
        return;
      }

      dispatch({
        type: 'parse-succeeded',
        data: result.data,
        categories: result.categories,
        filename: null,
        previewLabel: result.previewLabel,
        importSource: 'api',
        periodFrom: result.dateFrom,
        periodTo: result.dateTo,
        usingGenericProfile: false,
      });
    });
  }

  function handleConfirm() {
    if (!parsedData || !bankAccountId || importSource !== 'api') {
      return;
    }

    startConfirmTransition(async () => {
      const result = await confirmImport({
        bankAccountId,
        rows: parsedData,
        source: 'api',
        periodFrom,
        periodTo,
        filename: null,
      });

      if (!result.ok) {
        dispatch({ type: 'confirm-failed', error: result.error });
        return;
      }

      router.push(`/imports/${result.importId}`);
    });
  }

  async function handleCreateCategory(input: CategoryFormInput) {
    const result = await createCategory(input);

    if (result.ok && parsedData && bankAccountId) {
      setCreateCategoryOpen(false);
      setCreateCategoryPattern(null);

      startRematchTransition(async () => {
        const rematched = await rematchImportCategories(parsedData, bankAccountId);
        dispatch({
          type: 'categories-rematched',
          data: rematched.data,
          categories: rematched.categories,
        });
      });
    }

    return result;
  }

  if (linkedBankAccounts.length === 0) {
    return (
      <Alert>
        <AlertTitle>No linked accounts</AlertTitle>
        <AlertDescription>
          Connect a bank account in Settings → Accounts to import via the bank
          API.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <TooltipProvider>
      <div className="flex w-full flex-col gap-6">
        <Field>
          <FieldLabel>Linked account</FieldLabel>
          <Combobox
            className="w-full max-w-md"
            value={bankAccountId}
            onValueChange={(value) => {
              if (!value) return;
              dispatch({ type: 'set-bank-account', bankAccountId: value });
            }}
            placeholder="Select linked account"
            options={linkedBankAccounts.map((account) => ({
              value: account.id,
              label: account.label,
            }))}
          />
        </Field>

        <Field>
          <FieldLabel>Date range</FieldLabel>
          <DateRangePicker
            value={dateRange}
            onValueChange={setDateRange}
            className="w-full max-w-md"
          />
        </Field>

        <Button
          type="button"
          disabled={
            !bankAccountId ||
            !dateRange.dateFrom ||
            !dateRange.dateTo ||
            isFetching ||
            !!previewRows
          }
          onClick={handleFetch}
        >
          {isFetching ? 'Fetching…' : 'Fetch transactions'}
        </Button>

        {error ? (
          <Alert variant="destructive">
            <AlertTitle>Import failed</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}

        {previewRows && previewLabel && bankAccountId && categories ? (
          <ImportPreviewSection
            previewLabel={previewLabel}
            summaryParts={summaryParts as string[]}
            previewRows={previewRows}
            columns={columns}
            isConfirming={isConfirming}
            isRematching={isRematching}
            onCancel={() => dispatch({ type: 'clear-preview' })}
            onConfirm={handleConfirm}
          />
        ) : null}

        <CategoryFormSheet
          open={createCategoryOpen}
          onOpenChange={setCreateCategoryOpen}
          category={null}
          defaultPattern={createCategoryPattern ?? undefined}
          onSubmit={handleCreateCategory}
        />
      </div>
    </TooltipProvider>
  );
}
