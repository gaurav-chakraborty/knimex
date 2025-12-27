# FileX Developer Guide

## 1. Overview
FileX is a privacy-focused metadata management platform built with Next.js 15. It allows users to strip sensitive data (EXIF, GPS, device info) from images, documents, and videos entirely within the browser.

## 2. Tech Stack
- **Framework**: Next.js 15 (App Router)
- **Runtime**: React 19.2.0
- **Styling**: Tailwind CSS 4.0
- **Database**: Turso (SQLite) via Drizzle ORM
- **Authentication**: Better Auth
- **Processing**: Client-side logic using `exifreader`, `piexifjs`, `pdf-lib`, and `jszip`.

## 3. Brand Identity
The FileX brand is defined by its commitment to security and digital sovereignty.
- **Colors**: 
  - Cyan Blue: `#7DD3FC`
  - Sky Blue: `#38BDF8`
  - Deep Blue: `#0284C7`
- **Gradient**: `linear-gradient(135deg, #7DD3FC 0%, #38BDF8 50%, #0284C7 100%)`
- **Logo**: Abstract file/shield motif representing user control.

## 4. Key Components
- `FileXLogo`: The central branding component supporting standard, full, and icon variants.
- `DownloadCenter`: The main processing hub where file analysis and metadata stripping occur.
- `LoadingScreen`: A branded splash screen for initial app loads.

## 5. Deployment
The application is optimized for deployment on Vercel.
- **Environment Variables**: See `.env.example`.
- **Pre-deployment Checklist**:
  - [ ] All brand assets are in `public/brand/`.
  - [ ] Tailwind colors are configured in `globals.css`.
  - [ ] Metadata is updated in `layout.tsx`.

## 6. Architecture
FileX uses a "Server-less processing" architecture. All heavy lifting (file manipulation) is done via Web Workers or directly in the main thread using browser-compatible libraries to ensure zero data ever leaves the user's device.
