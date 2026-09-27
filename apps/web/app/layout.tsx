import type { Metadata } from "next";
import "./globals.css";
import { Footer } from "@/components/Footer";
import { Nav } from "@/components/Nav";
import { ThemeProvider } from "@/components/theme/ThemeProvider";
import { WorkflowHelp } from "@/components/public-surfaces/WorkflowHelp";

export const metadata: Metadata = {
  title: "MoveBooks AI — Migrate with evidence",
  description: "A governed, provider-neutral accounting migration experience from Movers & Ledgers.",
};

export default function RootLayout({ children }: Readonly<{children: React.ReactNode}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider>
          <Nav />
          {children}
          <WorkflowHelp />
          <Footer />
        </ThemeProvider>
      </body>
    </html>
  );
}
