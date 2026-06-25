'use client';

import { useEffect, useState, useTransition } from 'react';

import {
  completeBankAccountLink,
  listBankInstitutions,
  listConnectionAccounts,
  startBankConnection,
  type BankInstitutionOption,
  type ConnectionAccountOption,
} from '@/app/(protected)/settings/accounts/actions/bank-connection-actions';
import { Button } from '@/components/ui/button';
import { Combobox } from '@/components/ui/combobox';
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from '@/components/ui/field';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import type { BankAccountRow } from '@/lib/bank-accounts/get-bank-accounts';

type BankConnectSheetProps = {
  account: BankAccountRow | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pendingConnectionId?: string | null;
  onCompleted?: () => void;
};

export function BankConnectSheet({
  account,
  open,
  onOpenChange,
  pendingConnectionId = null,
  onCompleted,
}: BankConnectSheetProps) {
  const [institutions, setInstitutions] = useState<BankInstitutionOption[]>([]);
  const [institutionId, setInstitutionId] = useState('');
  const [accountOptions, setAccountOptions] = useState<ConnectionAccountOption[]>(
    [],
  );
  const [externalAccountId, setExternalAccountId] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isStarting, startStartTransition] = useTransition();
  const [isLoadingAccounts, startLoadAccountsTransition] = useTransition();
  const [isSaving, startSaveTransition] = useTransition();

  const pickerMode = Boolean(pendingConnectionId && account);

  useEffect(() => {
    if (!open || pickerMode) {
      return;
    }

    void listBankInstitutions('PT').then((result) => {
      setInstitutions(result.institutions);
      if (!result.ok) {
        setError(result.error);
      }
    });
  }, [open, pickerMode]);

  useEffect(() => {
    if (!open || !pickerMode || !pendingConnectionId) {
      return;
    }

    startLoadAccountsTransition(async () => {
      setError(null);
      const result = await listConnectionAccounts(pendingConnectionId);
      if (!result.ok) {
        setError(result.error);
        setAccountOptions([]);
        return;
      }

      setAccountOptions(result.accounts);
      if (result.accounts.length === 1) {
        setExternalAccountId(result.accounts[0]!.id);
      }
    });
  }, [open, pickerMode, pendingConnectionId]);

  function handleStartConnection() {
    if (!account || !institutionId) {
      return;
    }

    startStartTransition(async () => {
      setError(null);
      const result = await startBankConnection({
        bankAccountId: account.id,
        institutionId,
      });

      if (!result.ok) {
        setError(result.error);
        return;
      }

      window.location.href = result.authUrl;
    });
  }

  function handleSaveLink() {
    if (!account || !pendingConnectionId || !externalAccountId) {
      return;
    }

    startSaveTransition(async () => {
      setError(null);
      const result = await completeBankAccountLink({
        bankAccountId: account.id,
        connectionId: pendingConnectionId,
        externalAccountId,
      });

      if (!result.ok) {
        setError(result.error);
        return;
      }

      onCompleted?.();
      onOpenChange(false);
    });
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="overflow-y-auto sm:max-w-md">
        <SheetHeader>
          <SheetTitle>
            {pickerMode ? 'Choose bank account' : 'Connect bank'}
          </SheetTitle>
          <SheetDescription>
            {account
              ? pickerMode
                ? `Select which real account maps to "${account.label}".`
                : `Authorize read-only access for "${account.label}".`
              : 'Select an account first.'}
          </SheetDescription>
        </SheetHeader>

        <div className="flex flex-col gap-4 px-4 pb-4">
          {error ? <FieldError>{error}</FieldError> : null}

          {pickerMode ? (
            <>
              <Field>
                <FieldLabel>Bank account</FieldLabel>
                <Combobox
                  value={externalAccountId}
                  onValueChange={setExternalAccountId}
                  options={accountOptions.map((option) => ({
                    value: option.id,
                    label: option.label,
                  }))}
                  placeholder={
                    isLoadingAccounts ? 'Loading accounts…' : 'Select account'
                  }
                  disabled={isLoadingAccounts || accountOptions.length === 0}
                />
                <FieldDescription>
                  Only accounts returned by your bank after login are listed here.
                </FieldDescription>
              </Field>
              <Button
                type="button"
                disabled={!externalAccountId || isSaving}
                onClick={handleSaveLink}
              >
                {isSaving ? 'Saving…' : 'Save connection'}
              </Button>
            </>
          ) : (
            <>
              <Field>
                <FieldLabel>Bank</FieldLabel>
                <Combobox
                  value={institutionId}
                  onValueChange={setInstitutionId}
                  options={institutions.map((institution) => ({
                    value: institution.id,
                    label: institution.name,
                  }))}
                  placeholder="Select a bank"
                />
              </Field>
              <Button
                type="button"
                disabled={!institutionId || isStarting}
                onClick={handleStartConnection}
              >
                {isStarting ? 'Starting…' : 'Continue to bank login'}
              </Button>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
