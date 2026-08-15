import FileXLogo from "@/components/FileXLogo";
import Link from "next/link";

export const metadata = {
  title: "FileX Security",
  description: "FileX security controls and responsible-use boundaries.",
};

export default function SecurityPage() {
  return (
    <main className="min-h-screen bg-background px-6 py-12 text-foreground">
      <div className="mx-auto max-w-4xl space-y-12">
        <header className="flex items-center justify-between gap-6 border-b border-border pb-8">
          <FileXLogo variant="standard" size="sm" />
          <Link href="/" className="text-sm font-semibold text-cyan-700 hover:text-cyan-800 dark:text-cyan-300 dark:hover:text-cyan-200">Back to FileX</Link>
        </header>
        <section className="space-y-5">
          <p className="text-xs font-black uppercase tracking-[0.24em] text-emerald-700 dark:text-emerald-300">Security posture</p>
          <h1 className="text-4xl font-black tracking-tight text-foreground md:text-6xl">Security policy</h1>
          <p className="max-w-2xl text-lg leading-8 text-muted-foreground">FileX is designed to keep file transformations close to the user. The product emphasizes explicit review, clear export artifacts, and minimal retention.</p>
        </section>
        <div className="space-y-5">
          {[
            ["Browser-first processing", "The watermark editor uses an in-memory canvas and does not upload the source image. Metadata export remains an explicit user action."],
            ["Least-privilege delivery", "Generated bundles are downloaded directly to the user’s device. Optional logs and certificates are clearly separated from the cleaned files."],
            ["Responsible use", "Only remove watermarks from content you own or are authorized to edit. FileX does not bypass access controls or copyright restrictions."],
            ["Report a concern", "For security disclosures or privacy questions, contact contact@knimex.com and include the affected route and a reproducible description."],
          ].map(([title, body]) => (
            <article key={title} className="rounded-3xl border border-border bg-muted/40 p-6">
              <h2 className="font-bold text-foreground">{title}</h2>
              <p className="mt-3 text-sm leading-7 text-muted-foreground">{body}</p>
            </article>
          ))}
        </div>
      </div>
    </main>
  );
}
