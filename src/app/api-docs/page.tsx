import FileXLogo from "@/components/FileXLogo";
import Link from "next/link";

export const metadata = {
  title: "FileX API Documentation",
  description: "Integration notes and privacy guarantees for FileX.",
};

export default function ApiDocsPage() {
  return (
    <main className="min-h-screen bg-slate-950 px-6 py-12 text-slate-200">
      <div className="mx-auto max-w-4xl space-y-12">
        <header className="flex items-center justify-between gap-6 border-b border-white/10 pb-8">
          <FileXLogo variant="standard" size="sm" />
          <Link href="/" className="text-sm font-semibold text-cyan-300 hover:text-cyan-200">Back to FileX</Link>
        </header>
        <section className="space-y-5">
          <p className="text-xs font-black uppercase tracking-[0.24em] text-cyan-300">Integration surface</p>
          <h1 className="text-4xl font-black tracking-tight text-white md:text-6xl">FileX API documentation</h1>
          <p className="max-w-2xl text-lg leading-8 text-slate-400">FileX currently exposes a browser-first workflow. Files are staged by the user, analyzed in a batch, and exported only after an explicit review. Enterprise API access is being designed around the same privacy boundaries.</p>
        </section>
        <div className="grid gap-5 md:grid-cols-3">
          {[
            ["Metadata", "Extract and remove supported metadata fields through the review workflow."],
            ["Batching", "Process up to ten staged files in one secure export bundle."],
            ["Privacy", "Watermark cleanup and file transformations stay in the browser."],
          ].map(([title, body]) => (
            <article key={title} className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
              <h2 className="font-bold text-white">{title}</h2>
              <p className="mt-3 text-sm leading-6 text-slate-400">{body}</p>
            </article>
          ))}
        </div>
        <div className="rounded-3xl border border-cyan-300/20 bg-cyan-300/5 p-6 text-sm leading-7 text-cyan-100">
          Need an integration review? <Link href="/contact?topic=api" className="font-bold underline underline-offset-4">Contact the KNIMEX team</Link> with your use case and required data boundary.
        </div>
      </div>
    </main>
  );
}
