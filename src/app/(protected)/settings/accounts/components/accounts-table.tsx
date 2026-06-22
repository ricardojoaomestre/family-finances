'use client';

import { PencilIcon, Trash2Icon } from 'lucide-react';

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

type AccountsTableProps = {
  accounts: BankAccountRow[];
  onEdit: (account: BankAccountRow) => void;
  onDelete: (account: BankAccountRow) => void;
  isPending?: boolean;
};

export function AccountsTable({
  accounts,
  onEdit,
  onDelete,
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
          <TableHead className="w-24 text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {accounts.map((account) => {
          const configured = !isGenericImportProfile(account.importProfile);

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
              <TableCell className="text-right">
                <div className="flex justify-end gap-1">
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
