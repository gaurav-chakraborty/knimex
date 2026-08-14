"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, Shield, Zap, Lock, Globe, HardDrive, RefreshCw, HelpCircle, ArrowRight, Star, CreditCard, Gift, Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect, Suspense } from "react";
import { useSession } from "@/lib/auth-client";
import { toast } from "sonner";
import MobileNav from "@/components/MobileNav";
import { appPath } from "@/lib/app-path";

const PLANS = [
  {
    name: "Starter",
    price: "$0",
    description: "Perfect for casual users securing a few files.",
    features: [
      "Process up to 5 files/day",
      "Standard metadata removal",
      "JPEG & PNG support",
      "Client-side processing",
      "Community support"
    ],
    buttonText: "Start for Free",
    buttonVariant: "outline" as const,
    href: "/"
  },
  {
    name: "Pro",
    price: "$12",
    period: "/mo",
    description: "For professionals and privacy enthusiasts.",
    features: [
      "Unlimited file processing",
      "Deep AI privacy scan",
      "All file types (PDF, MP4, etc.)",
      "Batch processing (ZIP exports)",
      "Custom naming templates",
      "Priority email support"
    ],
    highlight: true,
    buttonText: "Get Pro Access",
    buttonVariant: "default" as const,
    href: "/register?plan=pro",
    planKey: "pro" as const
  },
  {
    name: "Enterprise",
    price: "Custom",
    description: "Secure your entire organization's workflow.",
    features: [
      "API access & webhooks",
      "On-premise deployment option",
      "SAML/SSO integration",
      "Custom privacy audit reports",
      "Dedicated account manager",
      "99.9% Uptime SLA"
    ],
    buttonText: "Contact Sales",
    buttonVariant: "outline" as const,
      href: "mailto:contact@knimex.com"
    }
  ];

export default function PricingPage() {
  return (
    <Suspense fallback={null}>
      <PricingPageContent />
    </Suspense>
  );
}

function PricingPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session } = useSession();
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  useEffect(() => {
    if (searchParams.get("checkout") === "cancelled") {
      toast.info("Checkout cancelled — no changes were made to your plan.");
    }
  }, [searchParams]);

  const handleGetPro = async () => {
    if (!session?.user) {
      router.push(appPath("/register?plan=pro"));
      return;
    }

    const token = localStorage.getItem("bearer_token");
    setCheckoutLoading(true);
    try {
      const res = await fetch(appPath("/api/billing/checkout"), {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ plan: "pro" }),
      });
      const data = await res.json();
      if (res.ok && data.url) {
        window.location.href = data.url;
      } else {
        toast.error(data.error || "Checkout is unavailable right now.");
      }
    } catch {
      toast.error("Checkout is unavailable right now.");
    } finally {
      setCheckoutLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#020617] text-white selection:bg-purple-500/30 font-sans antialiased overflow-x-hidden">
      {/* Background Effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-purple-600/10 blur-[150px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-600/10 blur-[150px] rounded-full" />
      </div>

      <div className="relative max-w-7xl mx-auto px-6 py-20 space-y-20">
        {/* Header */}
        <header className="flex justify-between items-center border-b border-white/5 pb-8">
          <Link href="/" className="flex items-center gap-4 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-600 to-blue-600 flex items-center justify-center shadow-lg shadow-purple-600/20 group-hover:scale-110 transition-transform">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tighter uppercase leading-none">FileX</h1>
            </div>
          </Link>
          <div className="flex items-center gap-6">
            <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-400">
              <Link href="/" className="hover:text-white transition-colors">Back to App</Link>
              <Link href="/api-docs" className="hover:text-white transition-colors">Documentation</Link>
            </nav>
            <div className="h-6 w-px bg-white/10 hidden md:block" />
            <Link href={session?.user ? "/account" : "/login"} className="hidden sm:block">
              <Button className="bg-white text-black hover:bg-slate-200 font-bold rounded-xl px-6">
                {session?.user ? "My Account" : "Sign In"}
              </Button>
            </Link>
            <MobileNav
              links={[
                { href: "/", label: "Back to App" },
                { href: session?.user ? "/account" : "/login", label: session?.user ? "My Account" : "Sign In" },
                { href: "/contact", label: "Contact" },
              ]}
            />
          </div>
        </header>

        {/* Hero Section */}
        <section className="text-center space-y-6">
          <Badge className="bg-purple-500/10 text-purple-400 border-purple-500/20 px-4 py-1.5 rounded-full text-xs font-bold tracking-wide uppercase">
            Transparent Pricing
          </Badge>
          <h2 className="text-5xl md:text-7xl font-black tracking-tighter max-w-4xl mx-auto leading-[0.9] uppercase">
            Secure Your Privacy <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-500 to-blue-500">at any scale.</span>
          </h2>
          <p className="text-slate-400 text-lg max-w-2xl mx-auto font-medium">
            Choose the plan that fits your security needs. No hidden fees, cancel anytime. 
            Join 10,000+ users securing their digital footprint.
          </p>
        </section>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {PLANS.map((plan) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              whileHover={{ y: -5 }}
              transition={{ duration: 0.3 }}
            >
              <Card className={`relative h-full bg-[#0f172a]/50 border-white/5 backdrop-blur-xl rounded-[2.5rem] overflow-hidden shadow-2xl transition-all hover:border-white/10 ${plan.highlight ? 'ring-2 ring-purple-500 shadow-purple-500/10' : ''}`}>
                {plan.highlight && (
                  <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-purple-500 to-blue-500" />
                )}
                <CardHeader className="p-8 pb-4">
                  <div className="flex justify-between items-start mb-4">
                    <CardTitle className="text-2xl font-black tracking-tight uppercase">{plan.name}</CardTitle>
                    {plan.highlight && (
                      <Badge className="bg-purple-500 text-white font-bold text-[10px] tracking-widest px-3 py-1">MOST POPULAR</Badge>
                    )}
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-5xl font-black">{plan.price}</span>
                    {plan.period && <span className="text-slate-500 font-bold text-lg">{plan.period}</span>}
                  </div>
                  <CardDescription className="text-slate-400 font-medium mt-4 leading-relaxed">
                    {plan.description}
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-8 pt-0 space-y-8">
                  <div className="h-px bg-white/5" />
                  <ul className="space-y-4">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-3 text-sm font-medium">
                        <Check className="w-5 h-5 text-green-400 shrink-0" />
                        <span className="text-slate-300">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  {(plan as any).planKey === "pro" ? (
                    <Button
                      onClick={handleGetPro}
                      disabled={checkoutLoading}
                      variant={plan.buttonVariant}
                      className={`w-full h-14 rounded-2xl font-black text-lg shadow-xl group ${
                        plan.highlight ? 'bg-white text-black hover:bg-slate-200' : 'border-white/10 hover:bg-white/5'
                      }`}
                    >
                      {checkoutLoading ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <>
                          {plan.buttonText}
                          <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                        </>
                      )}
                    </Button>
                  ) : (
                    <Link href={plan.href} className="block w-full">
                      <Button
                        variant={plan.buttonVariant}
                        className={`w-full h-14 rounded-2xl font-black text-lg shadow-xl group ${
                          plan.highlight ? 'bg-white text-black hover:bg-slate-200' : 'border-white/10 hover:bg-white/5'
                        }`}
                      >
                        {plan.buttonText}
                        <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                      </Button>
                    </Link>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Features Comparison Highlights */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-12 py-10 border-y border-white/5">
           {[
             { title: "Local Processing", desc: "Files never leave your browser context.", icon: HardDrive },
             { title: "Military Grade", desc: "Strips up to 120+ metadata fields.", icon: Shield },
             { title: "Batch Support", desc: "Process folders and ZIPs in one go.", icon: Zap },
           ].map((item) => (
             <div key={item.title} className="flex items-center gap-6">
                <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center shrink-0">
                  <item.icon className="w-6 h-6 text-purple-500" />
                </div>
                <div>
                  <h4 className="font-bold text-lg">{item.title}</h4>
                  <p className="text-sm text-slate-500 font-medium">{item.desc}</p>
                </div>
             </div>
           ))}
        </section>

        {/* FAQ Section */}
        <section className="space-y-12">
          <div className="text-center space-y-4">
            <h3 className="text-4xl font-black tracking-tight uppercase">Security FAQ</h3>
            <p className="text-slate-400 font-medium max-w-xl mx-auto">Everything you need to know about FileX pricing and security protocols.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {[
              { q: "Is the processing really client-side?", a: "Yes. For our Starter and Pro plans, all metadata stripping happens directly in your browser's V8 engine. Your original file content never touches our servers." },
              { q: "What metadata exactly is removed?", a: "We remove EXIF, IPTC, XMP, GPS coordinates, camera serials, software versions, author names, and internal organization markers." },
              { q: "Do you offer education discounts?", a: "We do! Students and researchers can apply for a 50% lifetime discount on the Pro plan. Contact our support team with your EDU email." },
              { q: "Is there a limit on file size?", a: "Starter users can process files up to 10MB. Pro users have a 2GB per-file limit, handled efficiently via web streams." }
            ].map((faq) => (
              <div key={faq.q} className="space-y-3 p-8 rounded-[2.5rem] bg-[#0f172a]/40 border border-white/5 hover:border-white/10 transition-colors">
                <h4 className="font-bold text-lg flex items-center gap-3">
                  <HelpCircle className="w-5 h-5 text-blue-500" />
                  {faq.q}
                </h4>
                <p className="text-sm text-slate-400 font-medium leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA Section */}
        <section className="p-12 md:p-20 rounded-[4rem] bg-gradient-to-tr from-purple-600/20 via-blue-600/10 to-transparent border border-white/5 text-center space-y-8 relative overflow-hidden shadow-2xl">
          <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white via-transparent to-transparent pointer-events-none" />
          <div className="relative space-y-6">
            <Badge className="bg-white/10 text-white border-white/20 px-4 py-1.5 rounded-full text-xs font-black tracking-[0.2em] uppercase">
              Join the Elite
            </Badge>
            <h3 className="text-4xl md:text-6xl font-black tracking-tighter max-w-3xl mx-auto uppercase leading-none">Ready to reclaim your digital sovereignty?</h3>
            <p className="text-slate-400 text-lg max-w-xl mx-auto font-medium">Join 10,000+ privacy-conscious users who trust FileX with their most sensitive data.</p>
            <div className="flex flex-wrap justify-center gap-4 pt-4">
              <Button onClick={() => router.push(appPath("/"))} className="h-16 px-12 rounded-2xl bg-white text-black hover:bg-slate-200 font-black text-xl shadow-2xl shadow-white/10">Get Started Now</Button>
              <Link href="/api-docs"><Button variant="outline" className="h-16 px-12 rounded-2xl border-white/10 hover:bg-white/5 font-black text-xl">View Documentation</Button></Link>
            </div>
          </div>
        </section>

        {/* Trust Badges */}
        <div className="flex flex-wrap justify-center items-center gap-12 md:gap-24 opacity-20 grayscale transition-all hover:opacity-40">
           <div className="flex items-center gap-2"><CreditCard className="w-6 h-6" /><span className="font-bold text-xl uppercase tracking-tighter">Stripe Verified</span></div>
           <div className="flex items-center gap-2"><Lock className="w-6 h-6" /><span className="font-bold text-xl uppercase tracking-tighter">AES-256 Auth</span></div>
           <div className="flex items-center gap-2"><Star className="w-6 h-6" /><span className="font-bold text-xl uppercase tracking-tighter">4.9/5 Rating</span></div>
           <div className="flex items-center gap-2"><Gift className="w-6 h-6" /><span className="font-bold text-xl uppercase tracking-tighter">Open Source</span></div>
        </div>

        {/* Footer */}
        <footer className="pt-20 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-8 opacity-50 text-[10px] font-black uppercase tracking-widest">
            <div className="flex items-center gap-4">
              <p>© 2025 KNIMEX. All rights reserved.</p>
            </div>
          <div className="flex gap-10">
            <Link href="/" className="hover:text-white transition-colors">App</Link>
            <Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link>
            <Link href="/terms" className="hover:text-white transition-colors">Terms of Service</Link>
            <Link href="/contact" className="hover:text-white transition-colors">Support Center</Link>
          </div>
        </footer>
      </div>
    </div>
  );
}
