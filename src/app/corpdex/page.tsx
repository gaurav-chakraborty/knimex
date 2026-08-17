import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Building2, BriefcaseBusiness, Mail, ShieldCheck } from "lucide-react";

export const metadata: Metadata = {
  title: "CorpDex",
  description:
    "CorpDex is the next KNIMEX enterprise route, prepared for corporate workflows, launch conversations, and partner-facing product material.",
};

const launchTracks = [
  {
    title: "Enterprise workflow surface",
    description:
      "Prepared as the next path-based KNIMEX product for corporate onboarding, intelligence, and operational workflows.",
    icon: Building2,
  },
  {
    title: "Commercial launch route",
    description:
      "Ready to host launch messaging, beta access, demo requests, and partner conversations without another domain migration.",
    icon: BriefcaseBusiness,
  },
  {
    title: "Portfolio-safe expansion",
    description:
      "Keeps the parent KNIMEX architecture intact while reserving a serious route for the next enterprise release.",
    icon: ShieldCheck,
  },
];

export default function CorpdexPage() {
  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,hsl(var(--background)),hsl(var(--muted)/0.3))] text-foreground">
      <section className="border-b border-border">
        <div className="mx-auto flex max-w-6xl flex-col gap-10 px-5 py-16 lg:px-8 lg:py-24">
          <div className="max-w-3xl">
            <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-filex-blue-deep dark:text-filex-cyan">
              KNIMEX portfolio route
            </p>
            <h1 className="mt-4 text-4xl font-semibold tracking-tight sm:text-5xl">
              CorpDex is prepared as the next enterprise route under KNIMEX.
            </h1>
            <p className="mt-5 text-lg leading-relaxed text-muted-foreground">
              This path is now cleanly reserved for the next corporate workspace, launch
              narrative, or partner-facing product surface. It keeps expansion under the
              parent domain without leaking unrelated product branding into the experience.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/"
                className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition-transform hover:-translate-y-0.5 hover:shadow-lg"
              >
                Back to KNIMEX
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
              <a
                href="mailto:contact@knimex.com?subject=CorpDex%20Enquiry"
                className="inline-flex items-center gap-2 rounded-full border border-border bg-background/75 px-5 py-3 text-sm font-semibold transition-colors hover:bg-accent"
              >
                <Mail className="h-4 w-4" aria-hidden="true" />
                Enquire about CorpDex
              </a>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {launchTracks.map((track) => {
              const Icon = track.icon;
              return (
                <div key={track.title} className="rounded-3xl border border-border bg-card p-6 shadow-sm">
                  <span className="grid h-10 w-10 place-items-center rounded-xl border border-border bg-background text-filex-blue-deep dark:text-filex-cyan">
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <h2 className="mt-5 text-lg font-semibold tracking-tight">{track.title}</h2>
                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{track.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </main>
  );
}
