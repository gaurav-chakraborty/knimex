import FileXLogo from "@/components/FileXLogo";
import Link from "next/link";
import { appPath } from "@/lib/app-path";

export const metadata = {
  title: "FileX API Documentation",
  description: "Integration notes and privacy guarantees for FileX.",
};

export default function ApiDocsPage() {
  return (
    <main className="min-h-screen bg-background px-6 py-12 text-foreground">
      <div className="mx-auto max-w-4xl space-y-12">
        <header className="flex items-center justify-between gap-6 border-b border-border pb-8">
          <FileXLogo variant="standard" size="sm" />
          <div className="flex items-center gap-4">
            <Link href="/" className="text-sm font-semibold text-muted-foreground hover:text-foreground">KNIMEX Home</Link>
            <Link href={appPath("/")} className="text-sm font-semibold text-cyan-700 hover:text-cyan-800 dark:text-cyan-300 dark:hover:text-cyan-200">Back to FileX</Link>
          </div>
        </header>
        <section className="space-y-5">
          <p className="text-xs font-black uppercase tracking-[0.24em] text-cyan-700 dark:text-cyan-300">Integration surface</p>
          <h1 className="text-4xl font-black tracking-tight text-foreground md:text-6xl">FileX API documentation</h1>
          <p className="max-w-2xl text-lg leading-8 text-muted-foreground">FileX currently exposes a browser-first workflow. Files are staged by the user, analyzed in a batch, and exported only after an explicit review. Enterprise API access is being designed around the same privacy boundaries.</p>
        </section>
        <div className="grid gap-5 md:grid-cols-3">
          {[
            ["Metadata", "Extract and remove supported metadata fields through the review workflow."],
            ["Batching", "Process large batches in secure export windows."],
            ["Privacy", "Watermark cleanup and file transformations stay in the browser."],
          ].map(([title, body]) => (
            <article key={title} className="rounded-3xl border border-border bg-muted/40 p-6">
              <h2 className="font-bold text-foreground">{title}</h2>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">{body}</p>
            </article>
          ))}
        </div>
        <div className="rounded-3xl border border-cyan-600/25 bg-cyan-50 p-6 text-sm leading-7 text-cyan-900 dark:border-cyan-300/20 dark:bg-cyan-300/5 dark:text-cyan-100">
          Need an integration review? <Link href={appPath("/contact?topic=api")} className="font-bold underline underline-offset-4">Contact the KNIMEX team</Link> with your use case and required data boundary.
        </div>
      </div>
    </main>
  );
}
