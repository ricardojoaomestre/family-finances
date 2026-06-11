'use client';

import { Loader2Icon, WalletIcon } from 'lucide-react';
import { useFormStatus } from 'react-dom';

import { Button } from '@/components/ui/button';

export function SignInSubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button
      type="submit"
      size="lg"
      className="gap-2 px-8"
      disabled={pending}
      aria-busy={pending}
    >
      {pending ? (
        <Loader2Icon className="size-4 animate-spin" />
      ) : (
        <WalletIcon className="size-4" />
      )}
      {pending ? 'Signing in...' : 'Sign in with Google'}
    </Button>
  );
}
