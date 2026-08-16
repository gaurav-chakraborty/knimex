import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  BriefcaseBusiness,
  Building2,
  FileArchive,
  FileText,
  Headset,
  Newspaper,
  Sparkles,
  Ticket,
} from "lucide-react";
import { appPath } from "@/lib/app-path";

const productCards = [
  {
    title: "FileX",
    status: "Live product",
    description:
      "Metadata review, document hygiene, privacy cleanup, and trust-focused file workflows under the KNIMEX umbrella.",
    href: appPath("/"),
    cta: "Open FileX",
    bullets: [
      "Readable product path",
      "Clean handoff from the parent site",
      "Keeps the core product under the KNIMEX brand",
    ],
    icon: FileArchive,
  },
  {
    title: "BizDex",
    status: "Live product",
    description:
      "Corporate intelligence, KYB research, and OSINT-oriented product experiences on a dedicated child path.",
    href: "/bizdex",
    cta: "Open BizDex",
    bullets: [
      "Commercial landing path",
      "Separated product intent",
      "Supports enterprise discovery and lead generation",
    ],
    icon: Building2,
  },
  {
    title: "CorpDex",
    status: "Reserved launch",
    description:
      "The apex structure is now ready for additional commercial launches without another domain reconfiguration.",
    href: "#products",
    cta: "Reserve the path",
    bullets: [
      "Built for path-based expansion",
      "Fits future product releases",
      "Preserves one company identity",
    ],
    icon: Sparkles,
  },
];

const publishingCards = [
  {
    title: "News and founder notes",
    description:
      "Use the root site for releases, announcements, updates, and directional messaging across the full KNIMEX portfolio.",
    icon: Newspaper,
  },
  {
    title: "Publications and research",
    description:
      "Add reports, explainers, practical guides, and research-backed material that builds authority with buyers and partners.",
    icon: FileText,
  },
  {
    title: "Freebies and lead magnets",
    description:
      "Launch templates, checklists, sample resources, and educational assets on branded landing paths under the same domain.",
    icon: Sparkles,
  },
  {
    title: "Commercial offers and services",
    description:
      "Support consulting, onboarding, implementation, audits, and service-led offers without fragmenting the company identity.",
    icon: BriefcaseBusiness,
  },
];

const supportCards = [
  {
    title: "General contact",
    description:
      "Use this route for partnerships, media, collaboration requests, founder conversations, and broader product discovery.",
    href: appPath("/contact"),
    primary: "Contact KNIMEX",
    secondaryHref: "#footer",
    secondary: "See contact routes",
    icon: Headset,
  },
  {
    title: "Ticketing and customer support",
    description:
      "Direct onboarding blockers, troubleshooting, account issues, and customer help through a visible support path.",
    href: appPath("/contact"),
    primary: "Support and ticketing",
    secondaryHref: appPath("/api-docs"),
    secondary: "Product documentation",
    icon: Ticket,
  },
  {
    title: "Commercial enquiries",
    description:
      "Keep a clean entry point for enterprise discussions, custom builds, implementation pricing, and strategic enquiries.",
    href: appPath("/pricing"),
    primary: "Pricing and plans",
    secondaryHref: appPath("/contact"),
    secondary: "Sales enquiries",
    icon: BriefcaseBusiness,
  },
];

const footerColumns = [
  {
    title: "Products",
    links: [
      { label: "FileX", href: appPath("/") },
      { label: "BizDex", href: "/bizdex" },
      { label: "CorpDex", href: "#products" },
      { label: "All product paths", href: "#products" },
    ],
  },
  {
    title: "Support",
    links: [
      { label: "General contact", href: appPath("/contact") },
      { label: "Ticketing and support", href: appPath("/contact") },
      { label: "API and product docs", href: appPath("/api-docs") },
      { label: "Pricing enquiries", href: appPath("/pricing") },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "Privacy", href: appPath("/privacy") },
      { label: "Terms", href: appPath("/terms") },
      { label: "Careers", href: appPath("/careers") },
      { label: "Publishing roadmap", href: "#publishing" },
    ],
  },
];

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-filex-blue-deep dark:text-filex-cyan">
      {children}
    </p>
  );
}

function SurfaceLink({
  href,
  children,
  primary = false,
}: {
  href: string;
  children: React.ReactNode;
  primary?: boolean;
}) {
  if (href.startsWith("#")) {
    return (
      <a
        href={href}
        className={
          primary
            ? "inline-flex items-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition-transform hover:-translate-y-0.5 hover:shadow-lg"
            : "inline-flex items-center gap-2 rounded-full border border-border bg-background/75 px-5 py-3 text-sm font-semibold transition-colors hover:bg-accent"
        }
      >
        {children}
      </a>
    );
  }

  return (
    <Link
      href={href}
      className={
        primary
          ? "inline-flex items-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition-transform hover:-translate-y-0.5 hover:shadow-lg"
          : "inline-flex items-center gap-2 rounded-full border border-border bg-background/75 px-5 py-3 text-sm font-semibold transition-colors hover:bg-accent"
      }
    >
      {children}
    </Link>
  );
}

export default function KnimexParent() {
  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,hsl(var(--background)),hsl(var(--muted)/0.42))] text-foreground">
      <header className="sticky top-0 z-40 border-b border-border bg-background/90 backdrop-blur-xl">
        <div className="mx-auto flex min-h-16 max-w-7xl flex-wrap items-center gap-5 px-5 py-3 lg:px-8">
          <a href="#top" className="flex shrink-0 items-center gap-3" aria-label="KNIMEX home">
            <span className="grid h-9 w-9 place-items-center rounded-xl border border-filex-blue/40 bg-accent font-mono text-sm font-bold text-filex-blue-deep dark:text-filex-cyan">
              K
            </span>
            <span className="flex flex-col">
              <span className="font-mono text-sm font-bold tracking-[0.2em]">KNIMEX</span>
              <span className="text-xs text-muted-foreground">
                Products, publishing, support and commercial paths
              </span>
            </span>
          </a>
          <nav className="hidden items-center gap-1 lg:flex" aria-label="Primary navigation">
            <a
              href="#products"
              className="rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            >
              Products
            </a>
            <a
              href="#publishing"
              className="rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            >
              Publishing
            </a>
            <a
              href="#support"
              className="rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            >
              Support
            </a>
            <a
              href="#footer"
              className="rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            >
              Contact
            </a>
          </nav>
          <div className="ml-auto flex items-center gap-2">
            <SurfaceLink href={appPath("/contact")}>Enquiries</SurfaceLink>
            <SurfaceLink href={appPath("/")} primary>
              FileX
              <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
            </SurfaceLink>
          </div>
        </div>
      </header>

      <main id="top">
        <section className="relative overflow-hidden border-b border-border">
          <div
            className="pointer-events-none absolute inset-0 opacity-60 [background-image:linear-gradient(hsl(var(--border)/0.42)_1px,transparent_1px),linear-gradient(90deg,hsl(var(--border)/0.42)_1px,transparent_1px)] [background-size:42px_42px]"
            aria-hidden="true"
          />
          <div className="relative mx-auto grid max-w-7xl gap-5 px-5 py-20 lg:grid-cols-[1.25fr_0.75fr] lg:px-8 lg:py-28">
            <div className="rounded-[28px] border border-border bg-card/90 p-8 shadow-[0_24px_80px_-48px_hsl(var(--foreground)/0.65)]">
              <SectionLabel>Parent platform live at knimex.com</SectionLabel>
              <h1 className="mt-5 max-w-4xl text-4xl font-semibold leading-[1.02] tracking-tight sm:text-6xl lg:text-7xl">
                Build every KNIMEX product under one credible, expandable front door.
              </h1>
              <p className="mt-6 max-w-3xl text-lg leading-relaxed text-muted-foreground">
                KNIMEX now works as the parent layer for products, research, publishing,
                founder updates, freebies, and support operations. Each product can live on
                its own child path while the root site stays coherent, commercial, and easier
                to trust.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <SurfaceLink href={appPath("/")} primary>
                  Explore FileX
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </SurfaceLink>
                <SurfaceLink href="/bizdex">Open BizDex</SurfaceLink>
                <SurfaceLink href="#support">Get support</SurfaceLink>
              </div>
              <dl className="mt-10 grid gap-3 border-t border-border pt-6 sm:grid-cols-3">
                {[
                  ["/filex", "Metadata hygiene and document safety"],
                  ["/bizdex", "KYB, corporate intelligence, and OSINT"],
                  ["/corpdex", "Reserved for the next commercial release"],
                ].map(([label, value]) => (
                  <div
                    key={label}
                    className="rounded-2xl border border-border bg-background/75 p-4"
                  >
                    <dt className="font-mono text-xl font-semibold">{label}</dt>
                    <dd className="mt-1 text-sm text-muted-foreground">{value}</dd>
                  </div>
                ))}
              </dl>
            </div>

            <aside className="rounded-[28px] border border-border bg-card/90 p-6 shadow-[0_24px_80px_-48px_hsl(var(--foreground)/0.65)]">
              <SectionLabel>Why this structure works</SectionLabel>
              <h2 className="mt-3 text-2xl font-semibold tracking-tight">
                The apex belongs to the company, not a single product.
              </h2>
              <div className="mt-6 grid gap-4">
                {[
                  [
                    "Brand clarity",
                    "Visitors understand the company first, then move into the right product path.",
                  ],
                  [
                    "Commercial flexibility",
                    "New offerings can launch under clean child paths without another domain rebuild.",
                  ],
                  [
                    "Shared support layer",
                    "Enquiries, ticketing, and product navigation sit in one predictable parent surface.",
                  ],
                ].map(([title, description]) => (
                  <div
                    key={title}
                    className="rounded-2xl border border-border bg-background/70 p-4"
                  >
                    <p className="text-sm font-semibold">{title}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{description}</p>
                  </div>
                ))}
              </div>
            </aside>
          </div>
        </section>

        <section id="products" className="scroll-mt-16 border-b border-border bg-muted/35">
          <div className="mx-auto max-w-7xl px-5 py-16 lg:px-8 lg:py-20">
            <SectionLabel>Products</SectionLabel>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight md:text-3xl">
              Products and platforms
            </h2>
            <p className="mt-3 max-w-3xl text-muted-foreground">
              Each product can keep its own implementation and deployment while still feeling
              part of one KNIMEX system.
            </p>
            <div className="mt-8 grid gap-4 md:grid-cols-3">
              {productCards.map((card) => {
                const Icon = card.icon;
                return (
                  <div
                    key={card.title}
                    className="rounded-3xl border border-border bg-card p-6 shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <span className="grid h-10 w-10 place-items-center rounded-xl border border-border bg-background text-filex-blue-deep dark:text-filex-cyan">
                        <Icon className="h-5 w-5" aria-hidden="true" />
                      </span>
                      <span className="rounded-full border border-border px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
                        {card.status}
                      </span>
                    </div>
                    <h3 className="mt-5 text-xl font-semibold tracking-tight">{card.title}</h3>
                    <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                      {card.description}
                    </p>
                    <ul className="mt-4 space-y-2 pl-5 text-sm text-muted-foreground">
                      {card.bullets.map((bullet) => (
                        <li key={bullet} className="list-disc">
                          {bullet}
                        </li>
                      ))}
                    </ul>
                    <div className="mt-5">
                      <SurfaceLink href={card.href}>
                        {card.cta}
                        <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
                      </SurfaceLink>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <section id="publishing" className="scroll-mt-16 border-b border-border">
          <div className="mx-auto max-w-7xl px-5 py-16 lg:px-8 lg:py-20">
            <SectionLabel>Publishing and growth</SectionLabel>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight md:text-3xl">
              Content, resources, and authority-building under the same domain
            </h2>
            <p className="mt-3 max-w-3xl text-muted-foreground">
              The root domain should not only route products. It should also host the content
              that builds trust, reach, and discovery momentum.
            </p>
            <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {publishingCards.map((card) => {
                const Icon = card.icon;
                return (
                  <div
                    key={card.title}
                    className="rounded-3xl border border-border bg-card p-6 shadow-sm"
                  >
                    <span className="grid h-10 w-10 place-items-center rounded-xl border border-border bg-background text-filex-blue-deep dark:text-filex-cyan">
                      <Icon className="h-5 w-5" aria-hidden="true" />
                    </span>
                    <h3 className="mt-5 text-lg font-semibold tracking-tight">{card.title}</h3>
                    <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                      {card.description}
                    </p>
                  </div>
                );
              })}
            </div>
            <div className="mt-6 flex flex-wrap gap-2">
              {["/news", "/blog", "/publications", "/freebies", "/products", "/resources"].map(
                (item) => (
                  <span
                    key={item}
                    className="rounded-full border border-border bg-background px-3 py-1.5 text-sm text-muted-foreground"
                  >
                    {item}
                  </span>
                ),
              )}
            </div>
          </div>
        </section>

        <section id="support" className="scroll-mt-16 border-b border-border bg-muted/35">
          <div className="mx-auto max-w-7xl px-5 py-16 lg:px-8 lg:py-20">
            <SectionLabel>Support and enquiries</SectionLabel>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight md:text-3xl">
              Support, ticketing, and commercial enquiry paths
            </h2>
            <p className="mt-3 max-w-3xl text-muted-foreground">
              The parent site should guide visitors to the right next step instead of making
              them guess whether they need sales, support, documentation, or contact.
            </p>
            <div className="mt-8 grid gap-4 md:grid-cols-3">
              {supportCards.map((card) => {
                const Icon = card.icon;
                return (
                  <div
                    key={card.title}
                    className="rounded-3xl border border-border bg-card p-6 shadow-sm"
                  >
                    <span className="grid h-10 w-10 place-items-center rounded-xl border border-border bg-background text-filex-blue-deep dark:text-filex-cyan">
                      <Icon className="h-5 w-5" aria-hidden="true" />
                    </span>
                    <h3 className="mt-5 text-lg font-semibold tracking-tight">{card.title}</h3>
                    <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                      {card.description}
                    </p>
                    <div className="mt-5 flex flex-wrap gap-3">
                      <SurfaceLink href={card.href} primary>
                        {card.primary}
                      </SurfaceLink>
                      <SurfaceLink href={card.secondaryHref}>{card.secondary}</SurfaceLink>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      </main>

      <footer
        id="footer"
        className="border-t border-border bg-[linear-gradient(180deg,hsl(var(--foreground)),hsl(210_30%_10%))] text-slate-100"
      >
        <div className="mx-auto grid max-w-7xl gap-10 px-5 py-12 lg:grid-cols-[1.5fr_1fr_1fr_1fr] lg:px-8">
          <div>
            <a href="#top" className="flex items-center gap-3">
              <span className="grid h-8 w-8 place-items-center rounded-lg border border-white/20 bg-white/10 font-mono text-sm font-bold">
                K
              </span>
              <span className="font-mono text-sm font-bold tracking-[0.2em]">KNIMEX</span>
            </a>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-slate-300">
              Parent home for products, intelligence platforms, publishing, support flows,
              and future commercial launches under a single domain strategy.
            </p>
          </div>

          {footerColumns.map((column) => (
            <div key={column.title}>
              <SectionLabel>{column.title}</SectionLabel>
              <div className="mt-4 grid gap-3">
                {column.links.map((link) =>
                  link.href.startsWith("#") ? (
                    <a
                      key={link.label}
                      href={link.href}
                      className="text-sm text-slate-300 transition-colors hover:text-white"
                    >
                      {link.label}
                    </a>
                  ) : (
                    <Link
                      key={link.label}
                      href={link.href}
                      className="text-sm text-slate-300 transition-colors hover:text-white"
                    >
                      {link.label}
                    </Link>
                  ),
                )}
              </div>
            </div>
          ))}
        </div>
        <div className="border-t border-white/10 px-5 py-5 text-center text-xs text-slate-400">
          © 2026 KNIMEX. Parent site for products, content, support operations, and future launches.
        </div>
      </footer>
    </div>
  );
}
