import type { Metadata } from "next";

const siteUrl = (
  process.env.NEXT_PUBLIC_SITE_URL ||
  (process.env.NODE_ENV === "production" ? "https://knimex.com" : "http://localhost:3000")
).replace(/\/$/, "");
const appBasePath = (
  process.env.NEXT_PUBLIC_APP_BASE_PATH ||
  (process.env.NODE_ENV === "production" ? "/filex" : "")
).replace(/\/$/, "");
const publicAppUrl = `${siteUrl}${appBasePath}`;

export const metadata: Metadata = {
  metadataBase: new URL(publicAppUrl),
  title: {
    default: "FileX by KNIMEX - Beyond the File. Your Metadata, Your Control.",
    template: "%s | FileX by KNIMEX",
  },
  description:
    "Beyond the file. Your metadata, your control. Remove sensitive metadata from your files without changing content.",
  keywords:
    "metadata editor, file metadata, EXIF editor, PDF metadata, audio tags, video metadata, FileX, KNIMEX, privacy tool, secure metadata removal",
  authors: [{ name: "KNIMEX Team" }],
  openGraph: {
    title: "FileX by KNIMEX - Beyond the File. Your Metadata, Your Control.",
    description:
      "Remove sensitive metadata from your files without changing content. Client-side, privacy-first, and built for clean handoffs.",
    type: "website",
    url: publicAppUrl,
    images: ["/brand/social/og-image.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: "FileX by KNIMEX - Beyond the File. Your Metadata, Your Control.",
    description:
      "Remove sensitive metadata from your files without changing content. Client-side, privacy-first, and built for clean handoffs.",
    images: ["/brand/social/twitter-card.png"],
  },
};

export default function FilexLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
