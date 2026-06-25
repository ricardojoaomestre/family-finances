import {
  ArrowLeftRightIcon,
  FileTextIcon,
  PiggyBankIcon,
  TrendingUpIcon,
  UploadIcon,
} from 'lucide-react';
import Link from 'next/link';
import { redirect } from 'next/navigation';

import { auth, signIn } from '@/auth';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { SignInSubmitButton } from '@/components/sign-in-submit-button';
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

const features = [
  {
    icon: UploadIcon,
    title: 'Import statements',
    description:
      'Upload bank and card statements and turn them into clean, categorized transactions in seconds.',
  },
  {
    icon: ArrowLeftRightIcon,
    title: 'Track transactions',
    description:
      'Browse, filter, and recategorize every expense and income across all your accounts.',
  },
  {
    icon: FileTextIcon,
    title: 'Monthly reports',
    description:
      'Build month-by-month reports with category totals, comparisons, and spending insights.',
  },
];

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string; error?: string }>;
}) {
  const session = await auth();
  const { callbackUrl, error } = await searchParams;
  const redirectTo = callbackUrl ?? '/dashboard';

  if (session?.user) {
    redirect(redirectTo);
  }

  return (
    <main className="relative flex min-h-screen flex-col overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10"
      >
        <div className="absolute -top-40 left-1/2 h-128 w-4xl -translate-x-1/2 rounded-full bg-primary/15 blur-3xl" />
        <div className="absolute -bottom-48 -left-32 h-96 w-96 rounded-full bg-chart-2/15 blur-3xl" />
        <div className="absolute -right-32 top-1/3 h-96 w-96 rounded-full bg-chart-4/15 blur-3xl" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,var(--border)_1px,transparent_1px),linear-gradient(to_bottom,var(--border)_1px,transparent_1px)] bg-size-[4rem_4rem] opacity-30 mask-[radial-gradient(ellipse_70%_60%_at_50%_0%,black,transparent)]" />
      </div>

      <header className="mx-auto flex w-full max-w-5xl items-center gap-2 px-6 py-6">
        <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-sm font-semibold text-primary-foreground">
          F
        </span>
        <span className="font-semibold">Family Finances</span>
      </header>

      <section className="mx-auto flex w-full max-w-5xl flex-1 flex-col items-center justify-center gap-8 px-6 py-16 text-center">
        <Badge variant="secondary" className="gap-1.5">
          <PiggyBankIcon className="size-3.5" />
          Your household money, in one place
        </Badge>

        <div className="flex flex-col gap-4">
          <h1 className="max-w-3xl text-balance text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
            Know where every euro of your family budget goes
          </h1>
          <p className="mx-auto max-w-xl text-balance text-lg text-muted-foreground">
            Import bank statements, categorize spending automatically, and
            review monthly reports together — without spreadsheets.
          </p>
        </div>

        {error && (
          <Alert variant="destructive" className="max-w-md">
            <AlertDescription>
              Sign in failed. Please try again.
            </AlertDescription>
          </Alert>
        )}

        <form
          action={async () => {
            'use server';
            await signIn('google', { redirectTo });
          }}
        >
          <SignInSubmitButton />
        </form>

        <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <TrendingUpIcon className="size-4" />
          Free for your family. No setup required.
        </p>
      </section>

      <section className="mx-auto grid w-full max-w-5xl gap-4 px-6 pb-12 sm:grid-cols-3">
        {features.map((feature) => (
          <Card key={feature.title} className="bg-card/60 backdrop-blur">
            <CardHeader>
              <div className="mb-2 flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <feature.icon className="size-5" />
              </div>
              <CardTitle>{feature.title}</CardTitle>
              <CardDescription>{feature.description}</CardDescription>
            </CardHeader>
          </Card>
        ))}
      </section>

      <footer className="mx-auto flex w-full max-w-5xl flex-wrap items-center justify-center gap-x-4 gap-y-2 px-6 pb-10 text-sm text-muted-foreground">
        <Link href="/privacy" className="hover:text-foreground">
          Privacy
        </Link>
        <span aria-hidden>·</span>
        <Link href="/terms" className="hover:text-foreground">
          Terms
        </Link>
      </footer>
    </main>
  );
}
