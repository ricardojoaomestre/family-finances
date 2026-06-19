'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';

import { acceptInvite } from '@/app/(protected)/settings/household/actions/household-actions';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

type AcceptInviteProps = {
  token: string;
};

export function AcceptInvite({ token }: AcceptInviteProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleAccept() {
    setError(null);
    startTransition(async () => {
      const result = await acceptInvite(token);

      if (!result.ok) {
        setError(result.error);
        return;
      }

      router.push('/dashboard');
    });
  }

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle>Join household</CardTitle>
        <CardDescription>
          You&apos;ve been invited to share a household&apos;s accounts and
          transactions.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {error ? (
          <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </p>
        ) : null}
      </CardContent>
      <CardFooter className="flex gap-2">
        <Button onClick={handleAccept} disabled={isPending}>
          Accept invite
        </Button>
        <Button
          variant="outline"
          disabled={isPending}
          onClick={() => router.push('/dashboard')}
        >
          Cancel
        </Button>
      </CardFooter>
    </Card>
  );
}
