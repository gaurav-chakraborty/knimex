"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { useSession } from "@/lib/auth-client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Shield,
  Zap,
  CreditCard,
  ArrowRight,
  Loader2,
  CheckCircle2,
  Sparkles,
  BarChart3,
} from "lucide-react";
import { toast } from "sonner";
import { appPath } from "@/lib/app-path";

interface BillingStatus {
  plan: string;
  subscriptionStatus: string;
  currentPeriodEnd: string | null;
  hasStripeCustomer: boolean;
  billingConfigured: boolean;
  usage: {
    date: string;
    used: number;
    limit: number | null;
    remaining: number | null;
  };
}

interface UsageHistoryDay {
  date: string;
  filesProcessed: number;
}

const PLAN_LABELS: Record<string, { label: string; color: string }> = {
  free: { label: "Starter", color: "bg-slate-700 text-foreground/90" },
  pro: { label: "Pro", color: "bg-gradient-to-r from-purple-600 to-blue-600 text-white" },
  enterprise: { label: "Enterprise", color: "bg-gradient-to-r from-amber-500 to-orange-600 text-white" },
};

export default function AccountPage() {
  return (
    <Suspense fallback={<AccountSkeletonPage />}>
      <AccountPageContent />
    </Suspense>
  );
}

function AccountSkeletonPage() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <Loader2 className="w-8 h-8 text-filex-blue-deep dark:text-filex-cyan animate-spin" />
    </div>
  );
}

function AccountPageContent() {
  const { data: session, isPending } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [status, setStatus] = useState<BillingStatus | null>(null);
  const [history, setHistory] = useState<UsageHistoryDay[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<"checkout" | "portal" | null>(null);

  useEffect(() => {
    if (!isPending && !session?.user) {
      router.push(appPath("/login?redirect=/account"));
    }
  }, [session, isPending, router]);

  useEffect(() => {
    if (session?.user) {
      fetchAll();
    }
  }, [session]);

  useEffect(() => {
    const checkout = searchParams.get("checkout");
    if (checkout === "success") {
      toast.success("You're all set! Your plan has been upgraded.");
    }
  }, [searchParams]);

  const fetchAll = async () => {
    const token = localStorage.getItem("bearer_token");
    setLoading(true);
    try {
      const [statusRes, historyRes] = await Promise.all([
        fetch(appPath("/api/billing/status"), { headers: { Authorization: `Bearer ${token}` } }),
        fetch(appPath("/api/billing/usage-history"), { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      if (statusRes.ok) setStatus(await statusRes.json());
      if (historyRes.ok) setHistory((await historyRes.json()).history);
    } catch (error) {
      console.error("Failed to load account details:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpgrade = async (plan: "pro" | "enterprise") => {
    const token = localStorage.getItem("bearer_token");
    setActionLoading("checkout");
    try {
      const res = await fetch(appPath("/api/billing/checkout"), {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ plan }),
      });
      const data = await res.json();
      if (res.ok && data.url) {
        window.location.href = data.url;
      } else {
        toast.error(data.error || "Unable to start checkout right now.");
      }
    } catch {
      toast.error("Unable to start checkout right now.");
    } finally {
      setActionLoading(null);
    }
  };

  const handleManageBilling = async () => {
    const token = localStorage.getItem("bearer_token");
    setActionLoading("portal");
    try {
      const res = await fetch(appPath("/api/billing/portal"), {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok && data.url) {
        window.location.href = data.url;
      } else {
        toast.error(data.error || "Unable to open billing portal.");
      }
    } catch {
      toast.error("Unable to open billing portal.");
    } finally {
      setActionLoading(null);
    }
  };

  if (isPending || !session?.user) {
    return <AccountSkeletonPage />;
  }

  const planInfo = PLAN_LABELS[status?.plan ?? "free"];
  const usagePct = status?.usage.limit
    ? Math.min(100, (status.usage.used / status.usage.limit) * 100)
    : 0;
  const maxHistoryValue = Math.max(1, ...(history?.map((d) => d.filesProcessed) ?? [1]));

  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-purple-500/30 font-sans antialiased">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-purple-600/10 blur-[150px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-600/10 blur-[150px] rounded-full" />
      </div>

      <div className="relative max-w-5xl mx-auto px-6 py-16 space-y-10">
        <header className="flex justify-between items-center border-b border-border/70 pb-8">
          <Link href={appPath("/")} className="flex items-center gap-4 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-600 to-blue-600 flex items-center justify-center shadow-lg shadow-purple-600/20 group-hover:scale-110 transition-transform">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-2xl font-black tracking-tighter uppercase leading-none">FileX</h1>
          </Link>
          <Link href={appPath("/")}>
            <Button variant="outline" className="rounded-xl border-border bg-accent/50 hover:bg-accent">
              Back to App
            </Button>
          </Link>
        </header>

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
          <h2 className="text-3xl font-black tracking-tight mb-1">Account &amp; Billing</h2>
          <p className="text-muted-foreground">Manage your plan, usage, and subscription.</p>
        </motion.div>

        {loading ? (
          <div className="grid md:grid-cols-2 gap-6">
            <Card className="bg-accent/50 border-border rounded-2xl">
              <CardHeader className="space-y-3">
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-4 w-48" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-10 w-full rounded-xl" />
              </CardContent>
            </Card>
            <Card className="bg-accent/50 border-border rounded-2xl">
              <CardHeader className="space-y-3">
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-4 w-48" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-24 w-full rounded-xl" />
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-6">
            <Card className="bg-accent/50 border-border backdrop-blur-xl rounded-2xl">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-white">
                    <Sparkles className="w-5 h-5 text-purple-400" /> Current Plan
                  </CardTitle>
                  <Badge className={`${planInfo.color} border-0 font-bold uppercase text-xs`}>
                    {planInfo.label}
                  </Badge>
                </div>
                <CardDescription className="text-muted-foreground">
                  Signed in as {session.user.email}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                {status?.subscriptionStatus === "active" && status.currentPeriodEnd && (
                  <p className="text-sm text-muted-foreground flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    Renews {new Date(status.currentPeriodEnd).toLocaleDateString()}
                  </p>
                )}

                {status?.plan === "free" ? (
                  <Button
                    onClick={() => handleUpgrade("pro")}
                    disabled={actionLoading === "checkout"}
                    className="w-full rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 hover:opacity-90 font-bold"
                  >
                    {actionLoading === "checkout" ? (
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    ) : (
                      <Zap className="w-4 h-4 mr-2" />
                    )}
                    Upgrade to Pro
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                ) : (
                  <Button
                    onClick={handleManageBilling}
                    disabled={actionLoading === "portal"}
                    variant="outline"
                    className="w-full rounded-xl border-border bg-accent/50 hover:bg-accent font-bold"
                  >
                    {actionLoading === "portal" ? (
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    ) : (
                      <CreditCard className="w-4 h-4 mr-2" />
                    )}
                    Manage Billing
                  </Button>
                )}

                {status && !status.billingConfigured && (
                  <p className="text-xs text-amber-400/80">
                    Billing isn&apos;t fully configured on this environment yet — checkout is disabled until Stripe keys are set.
                  </p>
                )}
              </CardContent>
            </Card>

            <Card className="bg-accent/50 border-border backdrop-blur-xl rounded-2xl">
              <CardHeader>
                <CardTitle className="text-white">Today&apos;s Usage</CardTitle>
                <CardDescription className="text-muted-foreground">
                  {status?.usage.limit === null
                    ? "Unlimited processing on your plan"
                    : `${status?.usage.used ?? 0} of ${status?.usage.limit ?? 5} files processed`}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {status?.usage.limit !== null && (
                  <Progress value={usagePct} className="h-2 bg-accent" />
                )}
                {status?.usage.limit !== null && (status?.usage.remaining ?? 0) === 0 && (
                  <p className="text-sm text-rose-400">
                    You&apos;ve hit today&apos;s limit. Upgrade to Pro for unlimited processing.
                  </p>
                )}
              </CardContent>
            </Card>

            <Card className="bg-accent/50 border-border backdrop-blur-xl rounded-2xl md:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <BarChart3 className="w-5 h-5 text-blue-400" /> Last 7 Days
                </CardTitle>
                <CardDescription className="text-muted-foreground">Files processed per day</CardDescription>
              </CardHeader>
              <CardContent>
                {history ? (
                  <div className="flex items-end justify-between gap-3 h-32">
                    {history.map((day) => (
                      <div key={day.date} className="flex-1 flex flex-col items-center gap-2">
                        <div
                          className="w-full rounded-t-lg bg-gradient-to-t from-purple-600 to-blue-500 min-h-[4px] transition-all"
                          style={{ height: `${(day.filesProcessed / maxHistoryValue) * 100}%` }}
                          title={`${day.filesProcessed} files`}
                        />
                        <span className="text-[10px] text-muted-foreground font-medium">
                          {new Date(day.date + "T00:00:00Z").toLocaleDateString(undefined, { weekday: "short" })}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <Skeleton className="h-32 w-full rounded-xl" />
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
