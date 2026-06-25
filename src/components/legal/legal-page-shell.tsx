import Link from 'next/link';

import { Button } from '@/components/ui/button';

type LegalPageShellProps = {
  title: string;
  lastUpdated: string;
  children: React.ReactNode;
};

export function LegalPageShell({
  title,
  lastUpdated,
  children,
}: LegalPageShellProps) {
  return (
    <main className="relative flex min-h-screen flex-col overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10"
      >
        <div className="absolute -top-40 left-1/2 h-128 w-4xl -translate-x-1/2 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,var(--border)_1px,transparent_1px),linear-gradient(to_bottom,var(--border)_1px,transparent_1px)] bg-size-[4rem_4rem] opacity-20 mask-[radial-gradient(ellipse_70%_60%_at_50%_0%,black,transparent)]" />
      </div>

      <header className="mx-auto flex w-full max-w-3xl items-center justify-between gap-4 px-6 py-6">
        <Link
          href="/"
          className="flex items-center gap-2 font-semibold transition-opacity hover:opacity-80"
        >
          <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-sm font-semibold text-primary-foreground">
            F
          </span>
          Family Finances
        </Link>
        <Button variant="ghost" size="sm" asChild>
          <Link href="/">Back to home</Link>
        </Button>
      </header>

      <article className="mx-auto w-full max-w-3xl flex-1 px-6 pb-20">
        <header className="mb-10 border-b pb-8">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            {title}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Last updated: {lastUpdated}
          </p>
        </header>

        <div className="prose prose-neutral dark:prose-invert max-w-none space-y-6 text-muted-foreground [&_h2]:text-foreground [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:tracking-tight [&_h3]:text-foreground [&_h3]:font-medium [&_li]:marker:text-muted-foreground [&_strong]:text-foreground">
          {children}
        </div>
      </article>

      <footer className="mx-auto flex w-full max-w-3xl flex-wrap items-center justify-center gap-x-4 gap-y-2 border-t px-6 py-6 text-sm text-muted-foreground">
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
