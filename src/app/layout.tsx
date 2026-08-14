import type { Metadata } from "next";
import "./globals.css";
import VisualEditsMessenger from "../visual-edits/VisualEditsMessenger";
import ErrorReporter from "@/components/ErrorReporter";
import Script from "next/script";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/components/theme-provider";
import CookieBanner from "@/components/CookieBanner";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";

const appBasePath = (process.env.NEXT_PUBLIC_APP_BASE_PATH ?? (process.env.NODE_ENV === "production" ? "/filex" : "")).replace(/\/$/, "");
const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || (process.env.NODE_ENV === "production" ? "https://knimex.com" : "http://localhost:3000")).replace(/\/$/, "");
const publicAppUrl = `${siteUrl}${appBasePath}`;

export const metadata: Metadata = {
  metadataBase: new URL(publicAppUrl),
  title: "FileX by KNIMEX - Beyond the File. Your Metadata, Your Control. ✨",
  description: "Beyond the File. Your Metadata, Your Control. Remove sensitive metadata from your files without changing content. 100% client-side, zero tracking. 🎨",
  keywords: "metadata editor, file metadata, EXIF editor, PDF metadata, audio tags, video metadata, FileX, KNIMEX, privacy tool, secure metadata removal",
  authors: [{ name: "KNIMEX Team" }],
  openGraph: {
    title: "FileX by KNIMEX - Beyond the File ✨",
    description: "Remove sensitive metadata from your files without changing content. 100% client-side, zero tracking.",
    type: "website",
    images: ["/brand/social/og-image.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: "FileX - Your Metadata, Your Control",
    description: "Remove sensitive metadata from your files without changing content.",
    images: ["/brand/social/twitter-card.png"],
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Favicons */}
        <link rel="icon" type="image/x-icon" href={`${appBasePath}/brand/favicons/favicon.ico`} />
        <link rel="icon" type="image/png" sizes="16x16" href={`${appBasePath}/brand/favicons/favicon-16x16.png`} />
        <link rel="icon" type="image/png" sizes="32x32" href={`${appBasePath}/brand/favicons/favicon-32x32.png`} />
        <link rel="apple-touch-icon" sizes="180x180" href={`${appBasePath}/brand/favicons/apple-touch-icon.png`} />
        <meta name="theme-color" content="#38BDF8" />
      </head>
        <body className="antialiased">
          {/* <Script
            id="orchids-browser-logs"
            src="https://slelguoygbfzlpylpxfs.supabase.co/storage/v1/object/public/scripts/orchids-browser-logs.js"
            strategy="afterInteractive"
            data-orchids-project-id="ea90ffb8-c80d-4a58-a133-17f6c1889bf6"
          /> */}
          <ThemeProvider defaultTheme="dark" storageKey="knimex-ui-theme">
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