'use client';

import { useState, useTransition } from 'react';

import type { BankAccountFormInput } from '@/app/(protected)/settings/accounts/actions/bank-account-actions';
import { Button } from '@/components/ui/button';
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import type { BankAccountRow } from '@/lib/bank-accounts/get-bank-accounts';
import {
  bankAccountImportProfileToFormInput,
  createDefaultBankAccountImportProfile,
  type BankAccountImportProfileFormField,
} from '@/lib/bank-accounts/validate-bank-account';

type BankAccountFormSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  account: BankAccountRow | null;
  onSubmit: (input: BankAccountFormInput) => Promise<{
    ok: boolean;
    error?: string;
    fieldErrors?: Partial<
      Record<'slug' | 'label' | BankAccountImportProfileFormField, string>
    >;
  }>;
};

function createInitialImportProfile(account: BankAccountRow | null) {
  return bankAccountImportProfileToFormInput(
    account?.importProfile ?? createDefaultBankAccountImportProfile(),
  );
}

export function BankAccountFormSheet({
  open,
  onOpenChange,
  account,
  onSubmit,
}: BankAccountFormSheetProps) {
  const [isPending, startTransition] = useTransition();
  const [slug, setSlug] = useState(account?.slug ?? '');
  const [label, setLabel] = useState(account?.label ?? '');
  const [importProfile, setImportProfile] = useState(() =>
    createInitialImportProfile(account),
  );
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<
    Partial<Record<'slug' | 'label' | BankAccountImportProfileFormField, string>>
  >({});

  function updateImportProfileField(
    field: BankAccountImportProfileFormField,
    value: string,
  ) {
    setImportProfile((current) => ({ ...current, [field]: value }));
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setFormError(null);
    setFieldErrors({});

    startTransition(async () => {
      const result = await onSubmit({
        slug,
        label,
        importProfile,
      });

      if (!result.ok) {
        setFormError(result.error ?? 'Something went wrong.');
        setFieldErrors(result.fieldErrors ?? {});
        return;
      }

      onOpenChange(false);
    });
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="overflow-y-auto sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>{account ? 'Edit account' : 'Add account'}</SheetTitle>
          <SheetDescription>
            Configure how CSV and Excel exports from this account are parsed.
          </SheetDescription>
        </SheetHeader>
        <form onSubmit={handleSubmit} className="flex flex-1 flex-col gap-6">
          <FieldGroup>
            {formError ? (
              <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {formError}
              </p>
            ) : null}
            <Field>
              <FieldLabel htmlFor="account-label">Label</FieldLabel>
              <FieldContent>
                <Input
                  id="account-label"
                  value={label}
                  onChange={(event) => setLabel(event.target.value)}
                  placeholder="BPI joint account"
                />
                <FieldError>{fieldErrors.label}</FieldError>
              </FieldContent>
            </Field>
            <Field>
              <FieldLabel htmlFor="account-slug">Slug</FieldLabel>
              <FieldContent>
                <Input
                  id="account-slug"
                  value={slug}
                  onChange={(event) => setSlug(event.target.value)}
                  placeholder="bpi"
                  disabled={Boolean(account)}
                  className="font-mono"
                />
                <FieldDescription>
                  Lowercase identifier used internally. Cannot be changed after
                  creation.
                </FieldDescription>
                <FieldError>{fieldErrors.slug}</FieldError>
              </FieldContent>
            </Field>
            <Field>
              <FieldLabel htmlFor="account-date-columns">Date columns</FieldLabel>
              <FieldContent>
                <Input
                  id="account-date-columns"
                  value={importProfile.dateColumns}
                  onChange={(event) =>
                    updateImportProfileField('dateColumns', event.target.value)
                  }
                  placeholder="data, data mov."
                />
                <FieldDescription>Comma-separated header names.</FieldDescription>
                <FieldError>{fieldErrors.dateColumns}</FieldError>
              </FieldContent>
            </Field>
            <Field>
              <FieldLabel htmlFor="account-description-columns">
                Description columns
              </FieldLabel>
              <FieldContent>
                <Input
                  id="account-description-columns"
                  value={importProfile.descriptionColumns}
                  onChange={(event) =>
                    updateImportProfileField(
                      'descriptionColumns',
                      event.target.value,
                    )
                  }
                  placeholder="descrição, movimento"
                />
                <FieldError>{fieldErrors.descriptionColumns}</FieldError>
              </FieldContent>
            </Field>
            <Field>
              <FieldLabel htmlFor="account-value-columns">Value columns</FieldLabel>
              <FieldContent>
                <Input
                  id="account-value-columns"
                  value={importProfile.valueColumns}
                  onChange={(event) =>
                    updateImportProfileField('valueColumns', event.target.value)
                  }
                  placeholder="valor, montante"
                />
                <FieldError>{fieldErrors.valueColumns}</FieldError>
              </FieldContent>
            </Field>
            <Field>
              <FieldLabel htmlFor="account-debit-columns">Debit columns</FieldLabel>
              <FieldContent>
                <Input
                  id="account-debit-columns"
                  value={importProfile.debitColumns}
                  onChange={(event) =>
                    updateImportProfileField('debitColumns', event.target.value)
                  }
                  placeholder="débito"
                />
                <FieldError>{fieldErrors.debitColumns}</FieldError>
              </FieldContent>
            </Field>
            <Field>
              <FieldLabel htmlFor="account-credit-columns">
                Credit columns
              </FieldLabel>
              <FieldContent>
                <Input
                  id="account-credit-columns"
                  value={importProfile.creditColumns}
                  onChange={(event) =>
                    updateImportProfileField('creditColumns', event.target.value)
                  }
                  placeholder="crédito"
                />
                <FieldError>{fieldErrors.creditColumns}</FieldError>
              </FieldContent>
            </Field>
            <Field>
              <FieldLabel htmlFor="account-balance-columns">
                Balance columns
              </FieldLabel>
              <FieldContent>
                <Input
                  id="account-balance-columns"
                  value={importProfile.balanceColumns}
                  onChange={(event) =>
                    updateImportProfileField('balanceColumns', event.target.value)
                  }
                  placeholder="saldo"
                />
                <FieldError>{fieldErrors.balanceColumns}</FieldError>
              </FieldContent>
            </Field>
            <Field>
              <FieldLabel htmlFor="account-date-format">Date format</FieldLabel>
              <FieldContent>
                <Select
                  value={importProfile.dateFormat}
                  onValueChange={(value) =>
                    updateImportProfileField('dateFormat', value)
                  }
                >
                  <SelectTrigger id="account-date-format" className="w-full">
                    <SelectValue placeholder="Select date format" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="auto">Auto-detect</SelectItem>
                    <SelectItem value="DMY">Day / month / year</SelectItem>
                    <SelectItem value="YMD">Year / month / day</SelectItem>
                  </SelectContent>
                </Select>
                <FieldError>{fieldErrors.dateFormat}</FieldError>
              </FieldContent>
            </Field>
            <Field>
              <FieldLabel htmlFor="account-sign-rule">Sign rule</FieldLabel>
              <FieldContent>
                <Select
                  value={importProfile.signRule}
                  onValueChange={(value) =>
                    updateImportProfileField('signRule', value)
                  }
                >
                  <SelectTrigger id="account-sign-rule" className="w-full">
                    <SelectValue placeholder="Select sign rule" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="as-is">As exported</SelectItem>
                    <SelectItem value="debit-negative">
                      Debits negative
                    </SelectItem>
                    <SelectItem value="credit-positive">
                      Credits positive
                    </SelectItem>
                    <SelectItem value="invert">Invert sign</SelectItem>
                  </SelectContent>
                </Select>
                <FieldError>{fieldErrors.signRule}</FieldError>
              </FieldContent>
            </Field>
            <Field>
              <FieldLabel htmlFor="account-min-header-row">
                Minimum header row
              </FieldLabel>
              <FieldContent>
                <Input
                  id="account-min-header-row"
                  value={importProfile.minHeaderRow}
                  onChange={(event) =>
                    updateImportProfileField('minHeaderRow', event.target.value)
                  }
                  inputMode="numeric"
                  placeholder="0"
                />
                <FieldError>{fieldErrors.minHeaderRow}</FieldError>
              </FieldContent>
            </Field>
            <Field>
              <FieldLabel htmlFor="account-skip-patterns">
                Skip row patterns
              </FieldLabel>
              <FieldContent>
                <Input
                  id="account-skip-patterns"
                  value={importProfile.skipRowPatterns}
                  onChange={(event) =>
                    updateImportProfileField(
                      'skipRowPatterns',
                      event.target.value,
                    )
                  }
                  placeholder="saldo inicial, total"
                />
                <FieldDescription>
                  Comma-separated substrings. Matching rows are ignored.
                </FieldDescription>
                <FieldError>{fieldErrors.skipRowPatterns}</FieldError>
              </FieldContent>
            </Field>
          </FieldGroup>
          <SheetFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {account ? 'Save changes' : 'Add account'}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
