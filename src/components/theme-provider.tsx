'use client';

import { ThemeProvider as NextThemesProvider } from 'next-themes';
import type { ThemeProviderProps } from 'next-themes';

const themeScriptProps =
  typeof window === 'undefined'
    ? undefined
    : ({ type: 'application/json' } as const);

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      storageKey="theme"
      disableTransitionOnChange
      scriptProps={themeScriptProps}
      {...props}
    >
      {children}
    </NextThemesProvider>
  );
}
