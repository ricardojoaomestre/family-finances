'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { CheckIcon, CopyIcon, Loader2Icon } from 'lucide-react';

import {
  createHousehold,
  deleteHousehold,
  inviteMember,
  leaveHousehold,
  removeMember,
  renameHousehold,
  revokeInvite,
  setPrimaryAccountMerchant,
} from '@/app/(protected)/settings/household/actions/household-actions';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Combobox } from '@/components/ui/combobox';
import { Field, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import type { HouseholdDetail } from '@/lib/household/get-household-detail';
import { MERCHANTS_SORTED_BY_LABEL } from '@/lib/merchants';

type HouseholdManagerProps = {
  detail: HouseholdDetail;
};

function getInitials(name: string | null, email: string | null): string {
  const source = name?.trim() || email?.trim() || '?';
  const parts = source.split(/\s+/).filter(Boolean);

  if (parts.length >= 2) {
    return `${parts[0]![0]}${parts[1]![0]}`.toUpperCase();
  }

  return source.slice(0, 2).toUpperCase();
}

export function HouseholdManager({ detail }: HouseholdManagerProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState(detail.name);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const [newHouseholdName, setNewHouseholdName] = useState('');
  const [primaryAccount, setPrimaryAccount] = useState(
    detail.primaryAccountMerchant ?? '',
  );
  const [copied, setCopied] = useState(false);

  const isOwner = detail.currentUserRole === 'owner';

  function run(action: () => Promise<{ ok: boolean; error?: string }>) {
    setError(null);
    startTransition(async () => {
      const result = await action();

      if (!result.ok) {
        setError(result.error ?? 'Something went wrong.');
        return;
      }

      router.refresh();
    });
  }

  function handleInvite() {
    setError(null);
    setInviteLink(null);
    startTransition(async () => {
      const result = await inviteMember(inviteEmail);

      if (!result.ok) {
        setError(result.error);
        return;
      }

      setInviteEmail('');
      setInviteLink(`${window.location.origin}/invite/${result.token}`);
      router.refresh();
    });
  }

  async function copyInviteLink() {
    if (!inviteLink) {
      return;
    }

    await navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="flex flex-col gap-6">
      {error ? (
        <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Details</CardTitle>
          <CardDescription>
            {isOwner
              ? 'Rename this household.'
              : 'Only the owner can rename this household.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
            <Field className="flex-1">
              <FieldLabel htmlFor="household-name">Name</FieldLabel>
              <Input
                id="household-name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                disabled={!isOwner || isPending}
              />
            </Field>
            {isOwner ? (
              <Button
                onClick={() => run(() => renameHousehold(name))}
                disabled={isPending || name.trim() === detail.name}
              >
                Save
              </Button>
            ) : null}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Primary account</CardTitle>
          <CardDescription>
            Used for the &ldquo;balance before income&rdquo; metric on monthly
            reports. Until bank accounts are configurable, pick from the
            built-in account list.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
            <Field className="flex-1">
              <FieldLabel htmlFor="primary-account">Account</FieldLabel>
              <Combobox
                id="primary-account"
                className="w-full"
                value={primaryAccount}
                onValueChange={setPrimaryAccount}
                placeholder="Select primary account"
                searchPlaceholder="Search accounts…"
                disabled={!isOwner || isPending}
                options={MERCHANTS_SORTED_BY_LABEL.map(({ slug, label }) => ({
                  value: slug,
                  label,
                }))}
              />
            </Field>
            {isOwner ? (
              <Button
                onClick={() =>
                  run(() => setPrimaryAccountMerchant(primaryAccount || null))
                }
                disabled={
                  isPending ||
                  primaryAccount === (detail.primaryAccountMerchant ?? '')
                }
              >
                Save
              </Button>
            ) : null}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Members</CardTitle>
          <CardDescription>
            People in this household share all accounts and transactions.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {detail.members.map((member) => (
            <div
              key={member.userId}
              className="flex items-center gap-3 rounded-md border p-3"
            >
              <Avatar size="sm">
                {member.image ? (
                  <AvatarImage
                    src={member.image}
                    alt={member.name ?? member.email ?? 'Member'}
                    referrerPolicy="no-referrer"
                  />
                ) : null}
                <AvatarFallback>
                  {getInitials(member.name, member.email)}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">
                  {member.name ?? member.email ?? 'Member'}
                  {member.isCurrentUser ? ' (you)' : ''}
                </p>
                {member.email ? (
                  <p className="truncate text-xs text-muted-foreground">
                    {member.email}
                  </p>
                ) : null}
              </div>
              <Badge variant={member.role === 'owner' ? 'default' : 'secondary'}>
                {member.role === 'owner' ? 'Owner' : 'Member'}
              </Badge>
              {isOwner && !member.isCurrentUser ? (
                <Button
                  variant="outline"
                  size="sm"
                  disabled={isPending}
                  onClick={() => run(() => removeMember(member.userId))}
                >
                  Remove
                </Button>
              ) : null}
            </div>
          ))}
        </CardContent>
      </Card>

      {isOwner ? (
        <Card>
          <CardHeader>
            <CardTitle>Invite a member</CardTitle>
            <CardDescription>
              Generate an invite link to share. They join after signing in with
              the invited email.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
              <Field className="flex-1">
                <FieldLabel htmlFor="invite-email">Email</FieldLabel>
                <Input
                  id="invite-email"
                  type="email"
                  placeholder="name@example.com"
                  value={inviteEmail}
                  onChange={(event) => setInviteEmail(event.target.value)}
                  disabled={isPending}
                />
              </Field>
              <Button onClick={handleInvite} disabled={isPending}>
                {isPending ? (
                  <Loader2Icon className="size-4 animate-spin" />
                ) : null}
                Invite
              </Button>
            </div>

            {inviteLink ? (
              <div className="flex items-center gap-2 rounded-md border bg-muted/40 p-2">
                <code className="min-w-0 flex-1 truncate text-xs">
                  {inviteLink}
                </code>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={copyInviteLink}
                >
                  {copied ? (
                    <CheckIcon className="size-4" />
                  ) : (
                    <CopyIcon className="size-4" />
                  )}
                  {copied ? 'Copied' : 'Copy'}
                </Button>
              </div>
            ) : null}

            {detail.pendingInvites.length > 0 ? (
              <div className="flex flex-col gap-2">
                <p className="text-xs font-medium text-muted-foreground">
                  Pending invites
                </p>
                {detail.pendingInvites.map((invite) => (
                  <div
                    key={invite.id}
                    className="flex items-center gap-3 rounded-md border p-2"
                  >
                    <span className="min-w-0 flex-1 truncate text-sm">
                      {invite.email}
                    </span>
                    <Badge variant="secondary">
                      {invite.role === 'owner' ? 'Owner' : 'Member'}
                    </Badge>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={isPending}
                      onClick={() => run(() => revokeInvite(invite.id))}
                    >
                      Revoke
                    </Button>
                  </div>
                ))}
              </div>
            ) : null}
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Other actions</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
            <Field className="flex-1">
              <FieldLabel htmlFor="new-household">Create a new household</FieldLabel>
              <Input
                id="new-household"
                placeholder="Household name"
                value={newHouseholdName}
                onChange={(event) => setNewHouseholdName(event.target.value)}
                disabled={isPending}
              />
            </Field>
            <Button
              variant="outline"
              disabled={isPending || !newHouseholdName.trim()}
              onClick={() => {
                run(() => createHousehold(newHouseholdName));
                setNewHouseholdName('');
              }}
            >
              Create
            </Button>
          </div>

          {detail.members.length === 1 && isOwner ? (
            <div className="flex items-center justify-between gap-3 rounded-md border border-destructive/40 p-3">
              <div>
                <p className="text-sm font-medium">Delete household</p>
                <p className="text-xs text-muted-foreground">
                  Permanently delete this household and all its data.
                </p>
              </div>
              <Button
                variant="destructive"
                disabled={isPending}
                onClick={() => run(() => deleteHousehold())}
              >
                Delete
              </Button>
            </div>
          ) : (
            <div className="flex items-center justify-between gap-3 rounded-md border border-destructive/40 p-3">
              <div>
                <p className="text-sm font-medium">Leave household</p>
                <p className="text-xs text-muted-foreground">
                  You will lose access to this household&apos;s data.
                </p>
              </div>
              <Button
                variant="destructive"
                disabled={isPending}
                onClick={() => run(() => leaveHousehold())}
              >
                Leave
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
