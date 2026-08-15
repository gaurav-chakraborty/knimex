import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  Braces,
  Download,
  FileArchive,
  FileText,
  Fingerprint,
  FolderTree,
  LayoutTemplate,
  Library,
  Link2,
  MonitorDown,
  Search,
  Terminal,
  Wrench,
} from "lucide-react";
import { appPath } from "@/lib/app-path";

const ecosystemCards = [
  {
    title: "Applications",
    description: "Full SaaS products that run inside the KNIMEX shell.",
    icon: FileArchive,
    href: "#products",
  },
  {
    title: "Tools",
    description: "Focused browser utilities with nothing to install.",
    icon: Wrench,
    href: "#tools",
  },
  {
    title: "Downloads",
    description: "Desktop apps, CLIs, templates and datasets with full release history.",
    icon: Download,
    href: "#downloads",
  },
  {
    title: "Resources",
    description: "Guides, references, datasets and example projects.",
    icon: Library,
    href: "#resources",
  },
  {
    title: "Documentation",
    description: "Product-aware docs with versioning and search.",
    icon: BookOpen,
    href: appPath("/api-docs"),
  },
  {
    title: "Writeups",
    description: "Engineering investigations, architecture notes and experiments.",
    icon: FileText,
    href: "#writing",
  },
];

const tools = [
  { name: "JSON Formatter", category: "Developer Tools", icon: Braces },
  { name: "CSV Inspector", category: "Data Tools", icon: FileText },
  { name: "Slug Generator", category: "Utilities", icon: Link2 },
  { name: "File Hash", category: "File Utilities", icon: Fingerprint },
];

const downloads = [
  { name: "FileX CLI", version: "2.3.1", icon: Terminal },
  { name: "KNIMEX Desktop", version: "0.9.2", icon: MonitorDown },
  { name: "Pipeline Templates Pack", version: "1.2.0", icon: LayoutTemplate },
];

const featuredSignals = [
  { title: "Workspaces", description: "Group files by project with shared metadata and tags." },
  { title: "Batch pipelines", description: "Chain conversion, extraction and validation steps across many files." },
  { title: "Content intelligence", description: "Extract structure from documents, tables and archives." },
  { title: "Versioned history", description: "Every processing run is recorded and repeatable." },
];

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-filex-blue-deep dark:text-filex-cyan">{children}</p>;
}

function ArrowLink({ href, children, subtle = false }: { href: string; children: React.ReactNode; subtle?: boolean }) {
  return (
    <a
      href={href}
      className={
        subtle
          ? "inline-flex items-center gap-1 text-sm font-medium text-filex-blue-deep transition-colors hover:text-filex-blue dark:text-filex-cyan dark:hover:text-filex-blue"
          : "inline-flex items-center gap-2 rounded-md bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition-transform hover:-translate-y-0.5 hover:shadow-lg"
      }
    >
      {children}
      <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
    </a>
  );
}

export default function KnimexParent() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-40 border-b border-border bg-background/90 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center gap-5 px-5 lg:px-8">
          <a href="#top" className="flex shrink-0 items-center gap-2.5" aria-label="KNIMEX home">
            <span className="grid h-8 w-8 place-items-center rounded-md border border-filex-blue/40 bg-accent font-mono text-sm font-bold text-filex-blue-deep dark:text-filex-cyan">K</span>
            <span className="font-mono text-sm font-bold tracking-[0.2em]">KNIMEX</span>
          </a>
          <nav className="hidden items-center gap-1 lg:flex" aria-label="Primary navigation">
            <a href="#products" className="rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground">Products</a>
            <a href="#tools" className="rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground">Tools</a>
            <a href="#resources" className="rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground">Resources</a>
            <a href={appPath("/api-docs")} className="rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground">Docs</a>
            <a href="#writing" className="rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground">Writeups</a>
          </nav>
          <div className="ml-auto flex items-center gap-2">
            <a href="#search" className="hidden items-center gap-2 rounded-md border border-border px-3 py-2 text-sm text-muted-foreground transition-colors hover:border-ring hover:text-foreground sm:inline-flex">
              <Search className="h-4 w-4" aria-hidden="true" />
              <span>Search</span>
            </a>
            <Link href={appPath("/login")} className="hidden rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground sm:inline-flex">Sign in</Link>
            <Link href={appPath("/register")} className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-transform hover:-translate-y-0.5">Get started</Link>
          </div>
        </div>
      </header>

      <main id="top">
        <section className="relative overflow-hidden border-b border-border">
          <div className="pointer-events-none absolute inset-0 opacity-60 [background-image:linear-gradient(hsl(var(--border)/0.42)_1px,transparent_1px),linear-gradient(90deg,hsl(var(--border)/0.42)_1px,transparent_1px)] [background-size:42px_42px]" aria-hidden="true" />
          <div className="relative mx-auto max-w-7xl px-5 py-24 lg:px-8 lg:py-32">
            <div className="max-w-4xl">
              <SectionLabel>Technology &amp; product hub</SectionLabel>
              <h1 className="mt-5 text-4xl font-semibold leading-[1.04] tracking-tight sm:text-6xl lg:text-7xl">Technology, tools and intelligent software — built in one ecosystem.</h1>
              <p className="mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground">KNIMEX brings together practical SaaS applications, AI tools, developer utilities, downloadable software, technical resources and engineering knowledge.</p>
              <div className="mt-9 flex flex-wrap gap-3">
                <a href="#products" className="inline-flex items-center gap-2 rounded-md bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition-transform hover:-translate-y-0.5 hover:shadow-lg">Explore KNIMEX <ArrowRight className="h-4 w-4" aria-hidden="true" /></a>
                <Link href={appPath("/")} className="inline-flex items-center gap-2 rounded-md border border-border-strong bg-background/60 px-6 py-3 text-sm font-semibold transition-colors hover:bg-accent">Explore FileX <ArrowUpRight className="h-4 w-4" aria-hidden="true" /></Link>
              </div>
            </div>
            <dl className="mt-16 grid max-w-3xl grid-cols-2 gap-x-8 gap-y-6 border-t border-border pt-8 sm:grid-cols-4">
              {[['Products', '5'], ['Tools', '5'], ['Downloads', '3'], ['Articles', '5']].map(([label, value]) => (
                <div key={label}><dt><SectionLabel>{label}</SectionLabel></dt><dd className="mt-1 font-mono text-2xl font-semibold">{value}</dd></div>
              ))}
            </dl>
          </div>
        </section>

        <section className="border-b border-border bg-muted/35">
          <div className="mx-auto max-w-7xl px-5 py-16 lg:px-8 lg:py-20">
            <div className="grid gap-8 rounded-xl border border-border bg-card p-7 shadow-sm md:grid-cols-[1.15fr_1fr] md:p-12">
              <div>
                <div className="flex items-center gap-3"><SectionLabel>Featured</SectionLabel><span className="inline-flex items-center rounded-full border border-filex-blue/40 px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.12em] text-filex-blue-deep dark:text-filex-cyan">active</span></div>
                <h2 className="mt-4 flex items-center gap-3 text-3xl font-semibold tracking-tight md:text-4xl"><FolderTree className="h-7 w-7 text-filex-blue-deep dark:text-filex-cyan" aria-hidden="true" />FileX</h2>
                <p className="mt-4 max-w-xl leading-relaxed text-muted-foreground">FileX is the flagship KNIMEX application. It brings structured file organisation, batch processing pipelines and content-aware extraction into a single workspace that runs entirely inside your KNIMEX account.</p>
                <div className="mt-8 flex flex-wrap gap-3"><Link href={appPath("/")} className="inline-flex items-center gap-2 rounded-md bg-filex-gradient px-5 py-2.5 text-sm font-semibold text-slate-950 transition-transform hover:-translate-y-0.5">Explore FileX <ArrowUpRight className="h-4 w-4" aria-hidden="true" /></Link><Link href={appPath("/api-docs")} className="inline-flex items-center rounded-md border border-border px-5 py-2.5 text-sm font-semibold transition-colors hover:bg-accent">Documentation</Link></div>
              </div>
              <ul className="grid gap-4 self-center">{featuredSignals.map((item) => <li key={item.title} className="border-l-2 border-filex-blue/40 pl-4"><p className="text-sm font-semibold">{item.title}</p><p className="mt-1 text-sm text-muted-foreground">{item.description}</p></li>)}</ul>
            </div>
          </div>
        </section>

        <section id="resources" className="scroll-mt-16 border-b border-border">
          <div className="mx-auto max-w-7xl px-5 py-16 lg:px-8 lg:py-20">
            <div className="mb-8"><SectionLabel>Explore</SectionLabel><h2 className="mt-2 text-2xl font-semibold tracking-tight md:text-3xl">The KNIMEX ecosystem</h2></div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{ecosystemCards.map((card) => { const Icon = card.icon; return <a key={card.title} href={card.href} className="group flex h-full flex-col rounded-xl border border-border bg-card p-5 transition-all hover:-translate-y-0.5 hover:border-ring hover:shadow-lg"><span className="grid h-9 w-9 place-items-center rounded-md border border-border bg-muted text-filex-blue-deep dark:text-filex-cyan"><Icon className="h-4 w-4" aria-hidden="true" /></span><h3 className="mt-4 text-lg font-semibold tracking-tight">{card.title}</h3><p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">{card.description}</p><span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-filex-blue-deep dark:text-filex-cyan">Open <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" /></span></a>; })}</div>
          </div>
        </section>

        <section id="products" className="scroll-mt-16 border-b border-border bg-muted/35">
          <div className="mx-auto max-w-7xl px-5 py-16 lg:px-8 lg:py-20">
            <div className="mb-8 flex flex-wrap items-end justify-between gap-4"><div><SectionLabel>Registry</SectionLabel><h2 className="mt-2 text-2xl font-semibold tracking-tight md:text-3xl">Latest products</h2></div><a href="#top" className="text-sm font-medium text-filex-blue-deep dark:text-filex-cyan">Back to overview ↑</a></div>
            <div className="grid gap-4 md:grid-cols-3">
              {[['KNIMEX Automation','Scheduled workflows and integrations across KNIMEX products.','coming soon'],['KNIMEX Analytics','Product and content analytics scoped to the KNIMEX ecosystem.','alpha'],['FileX','Intelligent file management, conversion and processing in the browser.','active']].map(([name, description, status]) => <Link key={name} href={name === 'FileX' ? appPath('/') : '#products'} className="group rounded-xl border border-border bg-card p-5 transition-all hover:-translate-y-0.5 hover:border-ring hover:shadow-lg"><div className="flex items-start justify-between gap-3"><span className="grid h-9 w-9 place-items-center rounded-md border border-border bg-muted text-filex-blue-deep dark:text-filex-cyan"><FolderTree className="h-4 w-4" aria-hidden="true" /></span><span className="rounded-full border border-border-strong px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground">{status}</span></div><h3 className="mt-4 text-lg font-semibold tracking-tight">{name}</h3><p className="mt-2 min-h-12 text-sm leading-relaxed text-muted-foreground">{description}</p><span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-filex-blue-deep dark:text-filex-cyan">Open <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" /></span></Link>)}
            </div>
          </div>
        </section>

        <section id="tools" className="scroll-mt-16 border-b border-border">
          <div className="mx-auto grid max-w-7xl gap-12 px-5 py-16 lg:grid-cols-2 lg:px-8 lg:py-20">
            <div><SectionLabel>Utilities</SectionLabel><h2 className="mt-2 text-2xl font-semibold tracking-tight md:text-3xl">Popular tools</h2><ul className="mt-8 divide-y divide-border border-y border-border">{tools.map(({ name, category, icon: Icon }) => <li key={name}><a href="#tools" className="flex items-center gap-4 py-4 transition-colors hover:text-filex-blue-deep dark:hover:text-filex-cyan"><Icon className="h-4 w-4 text-muted-foreground" aria-hidden="true" /><span className="text-sm font-medium">{name}</span><span className="ml-auto hidden text-xs text-muted-foreground sm:block">{category}</span></a></li>)}</ul></div>
            <div id="downloads" className="scroll-mt-16"><SectionLabel>Software</SectionLabel><h2 className="mt-2 text-2xl font-semibold tracking-tight md:text-3xl">Latest downloads</h2><ul className="mt-8 divide-y divide-border border-y border-border">{downloads.map(({ name, version, icon: Icon }) => <li key={name}><a href="#downloads" className="flex items-center gap-4 py-4 transition-colors hover:text-filex-blue-deep dark:hover:text-filex-cyan"><Icon className="h-4 w-4 text-muted-foreground" aria-hidden="true" /><span className="text-sm font-medium">{name}</span><span className="ml-auto font-mono text-xs text-muted-foreground">v{version}</span></a></li>)}</ul></div>
          </div>
        </section>

        <section id="writing" className="scroll-mt-16 border-b border-border bg-muted/35">
          <div className="mx-auto max-w-7xl px-5 py-16 lg:px-8 lg:py-20"><SectionLabel>Knowledge</SectionLabel><h2 className="mt-2 text-2xl font-semibold tracking-tight md:text-3xl">Latest writing</h2><div className="mt-8 grid gap-4 md:grid-cols-3">{[['A performance budget for a growing content platform','Keeping marketing and documentation pages off the application bundle.','2026-08-13'],['Introducing KNIMEX','Why we built a single technology hub instead of a collection of separate sites.','2026-08-12'],['FileX: the first KNIMEX application','What shipped in FileX 1.0 and where the roadmap goes next.','2026-08-09']].map(([title, description, date]) => <a key={title} href="#writing" className="rounded-xl border border-border bg-card p-5 transition-all hover:-translate-y-0.5 hover:border-ring hover:shadow-lg"><SectionLabel>Writeup</SectionLabel><h3 className="mt-4 text-lg font-semibold tracking-tight">{title}</h3><p className="mt-2 text-sm leading-relaxed text-muted-foreground">{description}</p><p className="mt-4 text-xs text-muted-foreground">{date} · 8 min read</p><span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-filex-blue-deep dark:text-filex-cyan">Open <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" /></span></a>)}</div></div>
        </section>
      </main>

      <footer className="mx-auto grid max-w-7xl gap-10 px-5 py-12 text-sm lg:grid-cols-[1.4fr_1fr_1fr_1fr] lg:px-8">
        <div><a href="#top" className="flex items-center gap-2.5"><span className="grid h-7 w-7 place-items-center rounded border border-filex-blue/40 bg-accent font-mono text-xs font-bold text-filex-blue-deep dark:text-filex-cyan">K</span><span className="font-mono font-bold tracking-[0.18em]">KNIMEX</span></a><p className="mt-4 max-w-xs leading-relaxed text-muted-foreground">A technology hub for applications, tools, software and engineering knowledge.</p></div>
        <div><SectionLabel>Products</SectionLabel><div className="mt-4 grid gap-3"><Link href={appPath("/")} className="text-muted-foreground transition-colors hover:text-foreground">FileX</Link><a href="#products" className="text-muted-foreground transition-colors hover:text-foreground">All products</a><a href="#tools" className="text-muted-foreground transition-colors hover:text-foreground">Tools</a></div></div>
        <div><SectionLabel>Resources</SectionLabel><div className="mt-4 grid gap-3"><Link href={appPath("/api-docs")} className="text-muted-foreground transition-colors hover:text-foreground">Documentation</Link><a href="#resources" className="text-muted-foreground transition-colors hover:text-foreground">Guides</a><a href="#writing" className="text-muted-foreground transition-colors hover:text-foreground">Writeups</a></div></div>
        <div id="search" className="scroll-mt-16"><SectionLabel>Company</SectionLabel><div className="mt-4 grid gap-3"><Link href={appPath("/contact")} className="text-muted-foreground transition-colors hover:text-foreground">Support</Link><Link href={appPath("/privacy")} className="text-muted-foreground transition-colors hover:text-foreground">Privacy</Link><Link href={appPath("/terms")} className="text-muted-foreground transition-colors hover:text-foreground">Terms</Link></div></div>
      </footer>
      <div className="border-t border-border px-5 py-5 text-center text-xs text-muted-foreground">© 2026 KNIMEX. All rights reserved. Built as one ecosystem.</div>
    </div>
  );
}
