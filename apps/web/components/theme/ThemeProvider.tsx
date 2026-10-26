"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";

/** Dark is the first-visit default (approved V2 design). An explicit choice, including System, is remembered. */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <NextThemesProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
      {children}
    </NextThemesProvider>
  );
}
