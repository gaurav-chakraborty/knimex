import type { Metadata } from "next";
import "./globals.css";
import VisualEditsMessenger from "../visual-edits/VisualEditsMessenger";
import ErrorReporter from "@/components/ErrorReporter";
import Script from "next/script";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/components/theme-provider";
import GlobalThemeControls from "@/components/global-theme-controls";
import CookieBanner from "@/components/CookieBanner";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";

const siteUrl = (
  process.env.NEXT_PUBLIC_SITE_URL ||
  (process.env.NODE_ENV === "production" ? "https://knimex.com" : "http://localhost:3000")
).replace(/\/$/, "");

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "KNIMEX | Enterprise products, intelligence platforms, and digital infrastructure",
    template: "%s | KNIMEX",
  },
  description:
    "KNIMEX is the parent operating surface for enterprise products, intelligence platforms, support operations, and commercial engagement.",
  keywords:
    "KNIMEX, enterprise products, digital infrastructure, intelligence platforms, business software, commercial engagement",
  authors: [{ name: "KNIMEX Team" }],
  openGraph: {
    title: "KNIMEX | Enterprise products, intelligence platforms, and digital infrastructure",
    description:
      "KNIMEX is the parent operating surface for enterprise products, intelligence platforms, support operations, and commercial engagement.",
    type: "website",
    url: siteUrl,
    images: ["/brand/knimex/knimex-mark.svg"],
  },
  twitter: {
    card: "summary_large_image",
    title: "KNIMEX | Enterprise products and digital infrastructure",
    description:
      "KNIMEX is the parent operating surface for enterprise products, intelligence platforms, support operations, and commercial engagement.",
    images: ["/brand/knimex/knimex-mark.svg"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" type="image/svg+xml" href="/brand/knimex/favicon.svg" />
        <link rel="shortcut icon" href="/brand/knimex/favicon.svg" />
        <meta name="theme-color" content="#0F172A" />
      </head>
        <body className="antialiased">
          {/* <Script
            id="orchids-browser-logs"
            src="https://slelguoygbfzlpylpxfs.supabase.co/storage/v1/object/public/scripts/orchids-browser-logs.js"
            strategy="afterInteractive"
            data-orchids-project-id="ea90ffb8-c80d-4a58-a133-17f6c1889bf6"
          /> */}
          <ThemeProvider defaultTheme="light" storageKey="knimex-ui-theme">
            <ErrorReporter />
            {/* <Script
              src="https://slelguoygbfzlpylpxfs.supabase.co/storage/v1/object/public/scripts/route-messenger.js"
              strategy="afterInteractive"
              data-target-origin="*"
              data-message-type="ROUTE_CHANGE"
              data-include-search-params="true"
              data-only-in-iframe="true"
              data-debug="true"
              data-custom-data='{"appName": "KNIMEX", "version": "1.0.0", "greeting": "hi"}'
            /> */}
              {children}
              <GlobalThemeControls />
              <CookieBanner />
              <Toaster />
              <Analytics />
              <SpeedInsights />
            {/* <VisualEditsMessenger /> */}
          </ThemeProvider>
        </body>
    </html>
  );
}
