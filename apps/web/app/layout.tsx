import type { Metadata } from "next";
import "@fontsource/schibsted-grotesk/400.css";
import "@fontsource/schibsted-grotesk/500.css";
import "@fontsource/schibsted-grotesk/600.css";
import "@fontsource/schibsted-grotesk/700.css";
import "./globals.css";
import "./v2.css";
import "./v2-workflow.css";
import "./v2-journey.css";
import "./v2-stages.css";
import "./v2-surfaces.css";
import { Footer } from "@/components/Footer";
import { Nav } from "@/components/Nav";
import { ThemeProvider } from "@/components/theme/ThemeProvider";
import { WorkflowHelp } from "@/components/public-surfaces/WorkflowHelp";
import { RuntimeNotice } from "@/components/RuntimeNotice";
import { IdentityProvider } from "@/components/IdentityProvider";

export const metadata: Metadata = {
  title: { default: "MoveBooks AI — Migrate with evidence", template: "%s · MoveBooks AI" },
  description: "A governed, provider-neutral accounting migration experience from Movers & Ledgers.",
};

export default function RootLayout({ children }: Readonly<{children: React.ReactNode}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="mb-v2">
        <ThemeProvider>
          <IdentityProvider>
          <Nav />
          <RuntimeNotice />
          {children}
          <WorkflowHelp />
          <Footer />
          </IdentityProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
