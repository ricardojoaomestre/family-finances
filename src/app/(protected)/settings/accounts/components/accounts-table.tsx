'use client';

import { Link2Icon, Link2OffIcon, PencilIcon, RefreshCwIcon, Trash2Icon } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { BankAccountRow } from '@/lib/bank-accounts/get-bank-accounts';
import { isGenericImportProfile } from '@/lib/bank-accounts/resolve-import-profile';
import type { BankAccountApiLinkRow } from '@/lib/bank-connections/types';
import { BankSyncStatusBadge } from '@/app/(protected)/settings/accounts/components/bank-sync-status-badge';

type AccountsTableProps = {
  accounts: BankAccountRow[];
  apiLinksByAccountId: Record<string, BankAccountApiLinkRow>;
  bankApiEnabled: boolean;
  onEdit: (account: BankAccountRow) => void;
  onDelete: (account: BankAccountRow) => void;
  onConnect: (account: BankAccountRow) => void;
  onUnlink: (account: BankAccountRow) => void;
  onSync: (account: BankAccountRow) => void;
  syncingAccountId?: string | null;
  isPending?: boolean;
};

export function AccountsTable({
  accounts,
  apiLinksByAccountId,
  bankApiEnabled,
  onEdit,
  onDelete,
  onConnect,
  onUnlink,
  onSync,
  syncingAccountId = null,
  isPending = false,
}: AccountsTableProps) {
  if (accounts.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No accounts yet. Add a bank account to import transactions.
      </p>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Label</TableHead>
          <TableHead>Slug</TableHead>
          <TableHead>Import profile</TableHead>
          {bankApiEnabled ? <TableHead>Bank API</TableHead> : null}
          <TableHead className="w-36 text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {accounts.map((account) => {
          const configured = !isGenericImportProfile(account.importProfile);
          const apiLink = apiLinksByAccountId[account.id] ?? null;
          const isSyncing = syncingAccountId === account.id;

          return (
            <TableRow key={account.id}>
              <TableCell className="font-medium">{account.label}</TableCell>
              <TableCell className="font-mono text-sm text-muted-foreground">
                {account.slug}
              </TableCell>
              <TableCell>
                <Badge variant={configured ? 'default' : 'secondary'}>
                  {configured ? 'Configured' : 'Generic'}
                </Badge>
              </TableCell>
              {bankApiEnabled ? (
                <TableCell>
                  <BankSyncStatusBadge apiLink={apiLink} />
                </TableCell>
              ) : null}
              <TableCell className="text-right">
                <div className="flex justify-end gap-1">
                  {bankApiEnabled ? (
                    apiLink ? (
                      <>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => onSync(account)}
                          disabled={isPending || isSyncing}
                          aria-label={`Sync ${account.label}`}
                        >
                          <RefreshCwIcon className={isSyncing ? 'animate-spin' : ''} />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => onUnlink(account)}
                          disabled={isPending}
                          aria-label={`Unlink ${account.label}`}
                        >
                          <Link2OffIcon />
                        </Button>
                      </>
                    ) : (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => onConnect(account)}
                        disabled={isPending}
                        aria-label={`Connect ${account.label}`}
                      >
                        <Link2Icon />
                      </Button>
                    )
                  ) : null}
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => onEdit(account)}
                    disabled={isPending}
                    aria-label={`Edit ${account.label}`}
                  >
                    <PencilIcon />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => onDelete(account)}
                    disabled={isPending}
                    aria-label={`Delete ${account.label}`}
                  >
                    <Trash2Icon />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
