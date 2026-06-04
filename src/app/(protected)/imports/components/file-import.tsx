'use client';

import { useRouter } from 'next/navigation';
import {
  useCallback,
  useMemo,
  useRef,
  useState,
  useTransition,
} from 'react';

import { confirmImport } from '@/app/(protected)/dashboard/actions/confirm-import';
import {
  importSpreadsheetFile,
  rematchImportCategories,
} from '@/app/(protected)/dashboard/actions/import-file';
import {
  getPreviewColumns,
  type PreviewRow,
} from '@/app/(protected)/dashboard/components/import-columns';
import { ImportDataTable } from '@/app/(protected)/dashboard/components/import-data-table';
import {
  createCategory,
  type CategoryFormInput,
} from '@/app/(protected)/settings/categories/actions/category-actions';
import { CategoryFormSheet } from '@/app/(protected)/settings/categories/components/category-form-sheet';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Field, FieldError, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { TooltipProvider } from '@/components/ui/tooltip';
import { useImportPreviewState } from '@/hooks/use-import-preview-state';
import { useSpreadsheetFile } from '@/hooks/use-spreadsheet-file';
import { escapeRegexLiteral } from '@/lib/categories/escape-regex-literal';
import {
  isMerchantSlug,
  MERCHANTS_SORTED_BY_LABEL,
} from '@/lib/merchants';

export function FileImport() {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const { validation, validate, clear } = useSpreadsheetFile();
  const [state, dispatch] = useImportPreviewState();
  const {
    parsedData,
    rowValidations,
    includeBalanceColumn,
    categories,
    filename,
    error,
    merchant,
  } = state;
  const [isParsing, startParseTransition] = useTransition();
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

  const handleOverrideDuplicate = useCallback(
    (rowIndex: number) => {
      dispatch({ type: 'override-duplicate', rowIndex });
    },
    [dispatch],
  );

  const handleOpenCreateCategory = useCallback((description: string) => {
    setCreateCategoryPattern(escapeRegexLiteral(description.trim()));
    setCreateCategoryOpen(true);
  }, []);

  const handleCreateCategorySheetOpenChange = useCallback((open: boolean) => {
    setCreateCategoryOpen(open);

    if (!open) {
      setCreateCategoryPattern(null);
    }
  }, []);

  const handleCreateCategory = useCallback(
    async (input: CategoryFormInput) => {
      const result = await createCategory(input);

      if (result.ok && parsedData) {
        setCreateCategoryOpen(false);
        setCreateCategoryPattern(null);

        startRematchTransition(async () => {
          const rematched = await rematchImportCategories(parsedData);

          dispatch({
            type: 'categories-rematched',
            data: rematched.data,
            categories: rematched.categories,
          });
        });
      }

      return result;
    },
    [dispatch, parsedData],
  );

  const columns = useMemo(() => {
    if (!categories) return [];

    return getPreviewColumns(
      includeBalanceColumn,
      categories,
      handleCategoryChange,
      handleOpenCreateCategory,
      handleOverrideDuplicate,
    );
  }, [
    includeBalanceColumn,
    categories,
    handleCategoryChange,
    handleOpenCreateCategory,
    handleOverrideDuplicate,
  ]);

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

  const handleCancelPreview = useCallback(() => {
    dispatch({ type: 'clear-preview' });
    formRef.current?.reset();
    clear();
    setCreateCategoryOpen(false);
    setCreateCategoryPattern(null);
  }, [clear, dispatch]);

  const handleMerchantChange = (value: string) => {
    if (!isMerchantSlug(value)) return;
    dispatch({ type: 'set-merchant', merchant: value });
  };

  const summaryParts = previewRows
    ? [
        `${previewRows.length} row${previewRows.length === 1 ? '' : 's'} parsed`,
        `${importableCount} importable`,
        duplicateCount > 0
          ? `${duplicateCount} duplicate${duplicateCount === 1 ? '' : 's'}`
          : null,
        invalidCount > 0 ? `${invalidCount} invalid` : null,
      ].filter(Boolean)
    : [];

  return (
    <TooltipProvider>
      <div className="flex w-full flex-col gap-6">
        <Field>
          <FieldLabel htmlFor="merchant">Merchant</FieldLabel>
          <Select value={merchant} onValueChange={handleMerchantChange}>
            <SelectTrigger id="merchant" className="w-full max-w-md">
              <SelectValue placeholder="Select merchant" />
            </SelectTrigger>
            <SelectContent>
              {MERCHANTS_SORTED_BY_LABEL.map(({ slug, label }) => (
                <SelectItem key={slug} value={slug}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>

        <form
          ref={formRef}
          action={(formData) => {
            if (!merchant) return;

            startParseTransition(async () => {
              dispatch({ type: 'parse-started' });
              formData.set('merchant', merchant);

              const file = formData.get('file');
              const parsedFilename =
                file instanceof File ? file.name : null;

              const result = await importSpreadsheetFile(formData);

              if (!result.ok) {
                dispatch({ type: 'parse-failed', error: result.error });
                return;
              }

              dispatch({
                type: 'parse-succeeded',
                data: result.data,
                categories: result.categories,
                filename: parsedFilename,
              });
              formRef.current?.reset();
              clear();
            });
          }}
        >
          <Field>
            <FieldLabel htmlFor="file">Select a file to import</FieldLabel>
            <Input
              type="file"
              id="file"
              name="file"
              accept=".csv,.xlsx,.xls"
              disabled={!merchant}
              onChange={(e) => validate(e.target.files?.[0] ?? null)}
            />
            {validation?.ok === false && (
              <FieldError>{validation.error}</FieldError>
            )}
          </Field>
          <Button
            type="submit"
            disabled={
              !merchant ||
              validation?.ok !== true ||
              isParsing ||
              !!previewRows
            }
            className="mt-4"
          >
            {isParsing ? 'Parsing…' : 'Parse file'}
          </Button>
        </form>

        {error && (
          <Alert variant="destructive">
            <AlertTitle>Import failed</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {previewRows && filename && merchant && categories && (
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1">
              <p className="text-sm font-medium">{filename}</p>
              <p className="text-sm text-muted-foreground">
                {summaryParts.join(' · ')}
              </p>
            </div>
            <ImportDataTable
              columns={columns}
              data={previewRows}
              paginate={false}
              tableClassName={isRematching ? 'opacity-60' : undefined}
            />
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                disabled={isConfirming}
                onClick={handleCancelPreview}
              >
                Cancel
              </Button>
              <Button
                type="button"
                disabled={isConfirming || isRematching}
                onClick={() => {
                  startConfirmTransition(async () => {
                    const result = await confirmImport({
                      filename,
                      merchant,
                      rows: parsedData!,
                    });

                    if (!result.ok) {
                      dispatch({
                        type: 'confirm-failed',
                        error: result.error,
                      });
                      return;
                    }

                    router.push('/imports');
                  });
                }}
              >
                {isConfirming ? 'Confirming…' : 'Confirm import'}
              </Button>
            </div>
          </div>
        )}

        <CategoryFormSheet
          open={createCategoryOpen}
          onOpenChange={handleCreateCategorySheetOpenChange}
          category={null}
          defaultPattern={createCategoryPattern ?? undefined}
          onSubmit={handleCreateCategory}
        />
      </div>
    </TooltipProvider>
  );
}
