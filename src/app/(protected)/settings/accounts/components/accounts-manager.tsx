'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';

import {
  createBankAccount,
  deleteBankAccount,
  updateBankAccount,
} from '@/app/(protected)/settings/accounts/actions/bank-account-actions';
import { AccountsTable } from '@/app/(protected)/settings/accounts/components/accounts-table';
import { BankAccountFormSheet } from '@/app/(protected)/settings/accounts/components/bank-account-form-sheet';
import { PrimaryOverflowActions } from '@/app/(protected)/components/primary-overflow-actions';
import { SetPageHeader } from '@/app/(protected)/components/protected-page-context';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import type { BankAccountRow } from '@/lib/bank-accounts/get-bank-accounts';

type AccountsManagerProps = {
  accounts: BankAccountRow[];
};

export function AccountsManager({ accounts }: AccountsManagerProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<BankAccountRow | null>(
    null,
  );
  const [deleteTarget, setDeleteTarget] = useState<BankAccountRow | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  function openCreateSheet() {
    setEditingAccount(null);
    setSheetOpen(true);
  }

  function openEditSheet(account: BankAccountRow) {
    setEditingAccount(account);
    setSheetOpen(true);
  }

  function handleSheetOpenChange(open: boolean) {
    setSheetOpen(open);

    if (!open) {
      setEditingAccount(null);
    }
  }

  function runDelete() {
    if (!deleteTarget) {
      return;
    }

    setActionError(null);
    startTransition(async () => {
      const result = await deleteBankAccount(deleteTarget.id);

      if (!result.ok) {
        setActionError(result.error);
        return;
      }

      setDeleteTarget(null);
      router.refresh();
    });
  }

  return (
    <>
      <SetPageHeader
        description="Bank accounts used for imports, notes, and reports."
        actions={
          <PrimaryOverflowActions
            primaryLabel="Add account"
            onPrimaryClick={openCreateSheet}
            primaryDisabled={isPending}
            overflowActions={[]}
          />
        }
      />
      <div className="flex flex-1 flex-col gap-4 p-4 sm:p-6">
        {actionError ? (
          <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {actionError}
          </p>
        ) : null}
        <AccountsTable
          accounts={accounts}
          onEdit={openEditSheet}
          onDelete={setDeleteTarget}
          isPending={isPending}
        />
      </div>

      <BankAccountFormSheet
        key={editingAccount?.id ?? 'new'}
        open={sheetOpen}
        onOpenChange={handleSheetOpenChange}
        account={editingAccount}
        onSubmit={async (input) => {
          if (editingAccount) {
            return updateBankAccount(editingAccount.id, input);
          }

          return createBankAccount(input);
        }}
      />

      <AlertDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open) {
            setDeleteTarget(null);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete account?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget
                ? `Remove ${deleteTarget.label}. Accounts with imports, transactions, or notes cannot be deleted.`
                : null}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={runDelete} disabled={isPending}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
