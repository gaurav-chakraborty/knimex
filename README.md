# FileX: Secure Metadata Management Platform

## Overview

FileX is a cutting-edge, client-side web application designed to empower users with complete control over their digital privacy by managing and sanitizing file metadata. Built with Next.js, React, and TailwindCSS, FileX offers a robust solution for extracting, removing, and replacing sensitive metadata from various file types, including images, PDFs, and office documents. The platform emphasizes user privacy, performing all processing locally within the browser to ensure no data leaves the user's device.

## Key Features

*   **Comprehensive Metadata Control**: Extract, remove, and replace metadata fields such as GPS coordinates, camera serial numbers, author information, software details, and timestamps.
*   **Multi-file Type Support**: Process a wide range of file formats including JPG, PNG, PDF, DOCX, XLSX, MP4, and more.
*   **Client-Side Processing**: All metadata operations are performed directly in the user's browser, ensuring maximum privacy and data security.
*   **AI-Powered Risk Assessment**: Intelligent analysis identifies potential privacy risks within file metadata, offering actionable suggestions for sanitization.
*   **Customizable Templates**: Apply predefined privacy templates (e.g., Student Submission, Job Application, Social Media Upload) or create custom configurations for tailored metadata management.
*   **Secure Export Options**: Download cleaned files, generate detailed privacy logs, export metadata snapshots (JSON), create audit reports (HTML), and obtain PDF certificates of privacy verification.
*   **User Authentication**: Secure user management and authentication powered by Better-Auth and Supabase PostgreSQL.
*   **Subscriptions & Billing**: Stripe-backed Free/Pro/Enterprise plans with checkout, a self-service billing portal, and an account dashboard at `/account`.
*   **Usage Enforcement**: Free-plan daily processing limits are tracked and enforced server-side, with graceful upgrade prompts when a limit is hit.
*   **Transactional Email**: Resend-backed notifications for hitting a daily limit and for subscription upgrades/cancellations (optional — skipped when unconfigured).
*   **Admin Revenue Visibility**: `/admin` surfaces plan distribution and an estimated MRR alongside existing user/feedback/analytics tooling.

## Technology Stack

FileX leverages a modern and efficient technology stack to deliver a high-performance and secure user experience:

*   **Framework**: Next.js (React)
*   **Styling**: TailwindCSS
*   **Database**: Supabase PostgreSQL (for user management and analytics)
*   **ORM**: Drizzle ORM
*   **Authentication**: Better-Auth
*   **Client-Side Libraries**: JSZip, jspdf, framer-motion, lucide-react, react-dropzone
*   **Development Tools**: ESLint, TypeScript

## Development Insights: Leveraging IBM Watson

During the development of FileX, **IBM Watson services** were instrumental in exploring advanced natural language processing and AI capabilities. Specifically, components of IBM Watson's AI toolkit were utilized for initial research and prototyping of the AI-powered risk assessment module, helping to refine the logic for identifying and categorizing sensitive information within file metadata. This early-stage integration provided valuable insights into building intelligent data analysis features, contributing to the robust privacy protection mechanisms now embedded in FileX.

## Getting Started

To get a local copy up and running, follow these simple steps.

### Prerequisites

Ensure you have Node.js (v18 or higher) and npm/yarn/pnpm/bun installed.

### Installation

1.  Clone the repository:
    ```bash
    git clone https://github.com/gaurav-chakraborty/filex.git
    cd filex
    ```
2.  Install dependencies:
    ```bash
    npm install # or yarn install, pnpm install, bun install
    ```
3.  Set up environment variables. Create a `.env.local` file in the root directory and populate it with necessary variables (refer to `.env.example` for guidance). Key variables include `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `DATABASE_URL`, and `AUTH_SECRET`.

### Running the Development Server

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

### Running Tests

Unit tests (Vitest) cover the metadata engine and the billing/usage-limit logic:

```bash
npm test
```

## Learn More

To learn more about Next.js, take a look at the following resources:

*   [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
*   [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
